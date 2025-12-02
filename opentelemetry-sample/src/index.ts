/**
 * ========================================
 * OpenTelemetry 統合サンプルアプリケーション
 * ========================================
 *
 * このアプリケーションは、OpenTelemetryの3つのシグナル
 * （Traces、Metrics、Logs）を統合的に使用する例を示します。
 *
 * 【アーキテクチャ】
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │                Express Application                  │
 *   │                                                     │
 *   │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
 *   │  │  Traces  │  │ Metrics  │  │   Logs   │         │
 *   │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
 *   │       │             │             │               │
 *   │       └─────────────┼─────────────┘               │
 *   │                     │                             │
 *   │              ┌──────▼──────┐                      │
 *   │              │ OpenTelemetry│                     │
 *   │              │     SDK      │                     │
 *   │              └──────┬──────┘                      │
 *   └─────────────────────┼───────────────────────────┘
 *                         │
 *            ┌────────────┼────────────┐
 *            ▼            ▼            ▼
 *       ┌────────┐  ┌────────┐  ┌────────┐
 *       │Console │  │  OTLP  │  │ Jaeger │
 *       │Exporter│  │Exporter│  │  etc.  │
 *       └────────┘  └────────┘  └────────┘
 *
 * 【提供するAPI】
 * - GET  /              : ヘルスチェック
 * - GET  /api/users     : ユーザー一覧取得
 * - GET  /api/users/:id : ユーザー詳細取得
 * - POST /api/orders    : 注文作成
 * - GET  /api/slow      : 遅いAPI（パフォーマンステスト用）
 * - GET  /api/error     : エラーAPI（エラーハンドリングテスト用）
 */

// 重要: OpenTelemetryは他のモジュールより先に初期化する必要がある
import { setupDevelopment } from './instrumentation/setup';
const sdk = setupDevelopment('sample-api');

import express, { Request, Response, NextFunction } from 'express';
import { trace, metrics, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

// アプリケーション設定
const app = express();
const PORT = process.env.PORT || 3000;

// Tracer, Meter, Logger を取得
const tracer = trace.getTracer('sample-api', '1.0.0');
const meter = metrics.getMeter('sample-api', '1.0.0');
const logger = logs.getLogger('sample-api', '1.0.0');

// ============================================================
// メトリクスの定義
// ============================================================

// HTTPリクエストカウンター
const httpRequestCounter = meter.createCounter('http.requests.total', {
  description: 'HTTPリクエストの総数',
  unit: '1',
});

// HTTPレスポンス時間ヒストグラム
const httpResponseDuration = meter.createHistogram('http.response.duration', {
  description: 'HTTPレスポンスの所要時間',
  unit: 'ms',
});

// アクティブリクエスト数
const activeRequests = meter.createUpDownCounter('http.requests.active', {
  description: 'アクティブなHTTPリクエスト数',
  unit: '1',
});

// エラーカウンター
const errorCounter = meter.createCounter('errors.total', {
  description: 'エラーの総数',
  unit: '1',
});

// ============================================================
// ミドルウェア
// ============================================================

// JSONボディパーサー
app.use(express.json());

// リクエストID生成ミドルウェア
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// 計測ミドルウェア
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // アクティブリクエスト数を増加
  activeRequests.add(1, { 'http.method': req.method });

  // リクエスト開始ログ
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'リクエスト受信',
    attributes: {
      'request.id': requestId,
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.headers['user-agent'] || 'unknown',
    },
  });

  // レスポンス完了時の処理
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // アクティブリクエスト数を減少
    activeRequests.add(-1, { 'http.method': req.method });

    // メトリクスを記録
    httpRequestCounter.add(1, {
      'http.method': req.method,
      'http.route': req.route?.path || req.url,
      'http.status_code': res.statusCode,
    });

    httpResponseDuration.record(duration, {
      'http.method': req.method,
      'http.route': req.route?.path || req.url,
      'http.status_code': res.statusCode,
    });

    // レスポンスログ
    logger.emit({
      severityNumber: res.statusCode >= 400 ? SeverityNumber.ERROR : SeverityNumber.INFO,
      severityText: res.statusCode >= 400 ? 'ERROR' : 'INFO',
      body: 'リクエスト完了',
      attributes: {
        'request.id': requestId,
        'http.method': req.method,
        'http.url': req.url,
        'http.status_code': res.statusCode,
        'http.duration_ms': duration,
      },
    });
  });

  next();
});

// ============================================================
// 模擬データベース
// ============================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Order {
  id: string;
  userId: number;
  items: string[];
  total: number;
  status: string;
}

const users: User[] = [
  { id: 1, name: '田中太郎', email: 'tanaka@example.com', role: 'admin' },
  { id: 2, name: '鈴木花子', email: 'suzuki@example.com', role: 'user' },
  { id: 3, name: '佐藤一郎', email: 'sato@example.com', role: 'user' },
];

const orders: Order[] = [];
let orderIdCounter = 1;

// データベースクエリをシミュレート
async function simulateDbQuery(operation: string, table: string, duration: number = 50): Promise<void> {
  return tracer.startActiveSpan(`db.${operation}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.system': 'postgresql',
      'db.name': 'sample_db',
      'db.operation': operation,
      'db.table': table,
    },
  }, async (span) => {
    await new Promise(resolve => setTimeout(resolve, duration));
    span.setAttribute('db.duration_ms', duration);
    span.end();
  });
}

// 外部API呼び出しをシミュレート
async function simulateExternalApi(service: string, duration: number = 100): Promise<boolean> {
  return tracer.startActiveSpan(`external.${service}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'external.service': service,
      'http.method': 'POST',
    },
  }, async (span) => {
    await new Promise(resolve => setTimeout(resolve, duration));

    // 10%の確率で失敗
    const success = Math.random() > 0.1;

    span.setAttribute('external.success', success);
    span.setAttribute('external.duration_ms', duration);

    if (!success) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'External API failed' });
    }

    span.end();
    return success;
  });
}

// ============================================================
// APIエンドポイント
// ============================================================

// ヘルスチェック
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'OpenTelemetry Sample API',
    timestamp: new Date().toISOString(),
  });
});

// ユーザー一覧取得
app.get('/api/users', async (req: Request, res: Response) => {
  await tracer.startActiveSpan('get-users', async (span) => {
    try {
      // DBクエリをシミュレート
      await simulateDbQuery('SELECT', 'users', 30);

      span.setAttribute('users.count', users.length);
      span.setStatus({ code: SpanStatusCode.OK });

      res.json({ users, count: users.length });
    } finally {
      span.end();
    }
  });
});

// ユーザー詳細取得
app.get('/api/users/:id', async (req: Request, res: Response) => {
  await tracer.startActiveSpan('get-user-by-id', async (span) => {
    const userId = parseInt(req.params.id);
    span.setAttribute('user.id', userId);

    try {
      // DBクエリをシミュレート
      await simulateDbQuery('SELECT', 'users', 20);

      const user = users.find(u => u.id === userId);

      if (!user) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'User not found' });

        errorCounter.add(1, { 'error.type': 'NotFound', 'resource': 'user' });

        logger.emit({
          severityNumber: SeverityNumber.WARN,
          severityText: 'WARN',
          body: 'ユーザーが見つかりません',
          attributes: {
            'user.id': userId,
          },
        });

        res.status(404).json({ error: 'User not found' });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        res.json(user);
      }
    } finally {
      span.end();
    }
  });
});

// 注文作成
app.post('/api/orders', async (req: Request, res: Response) => {
  await tracer.startActiveSpan('create-order', async (span) => {
    const { userId, items } = req.body;

    span.setAttribute('order.user_id', userId);
    span.setAttribute('order.items_count', items?.length || 0);

    try {
      // バリデーション
      if (!userId || !items || items.length === 0) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid request' });

        errorCounter.add(1, { 'error.type': 'ValidationError', 'resource': 'order' });

        logger.emit({
          severityNumber: SeverityNumber.WARN,
          severityText: 'WARN',
          body: '注文バリデーションエラー',
          attributes: {
            'user.id': userId,
            'validation.error': 'Missing required fields',
          },
        });

        res.status(400).json({ error: 'userId and items are required' });
        return;
      }

      // ユーザー確認
      await simulateDbQuery('SELECT', 'users', 15);

      const user = users.find(u => u.id === userId);
      if (!user) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'User not found' });
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 在庫確認
      await simulateDbQuery('SELECT', 'inventory', 25);

      // 決済処理（外部API）
      const paymentSuccess = await simulateExternalApi('payment-gateway', 150);

      if (!paymentSuccess) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment failed' });

        errorCounter.add(1, { 'error.type': 'PaymentFailed', 'resource': 'order' });

        logger.emit({
          severityNumber: SeverityNumber.ERROR,
          severityText: 'ERROR',
          body: '決済処理に失敗しました',
          attributes: {
            'user.id': userId,
            'payment.gateway': 'payment-gateway',
          },
        });

        res.status(500).json({ error: 'Payment processing failed' });
        return;
      }

      // 注文作成
      const order: Order = {
        id: `ORD-${orderIdCounter++}`,
        userId,
        items,
        total: items.length * 1000,
        status: 'created',
      };

      await simulateDbQuery('INSERT', 'orders', 20);
      orders.push(order);

      span.setAttribute('order.id', order.id);
      span.setAttribute('order.total', order.total);
      span.setStatus({ code: SpanStatusCode.OK });

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: '注文が作成されました',
        attributes: {
          'order.id': order.id,
          'user.id': userId,
          'order.total': order.total,
        },
      });

      res.status(201).json(order);
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
});

// 遅いAPI（パフォーマンステスト用）
app.get('/api/slow', async (req: Request, res: Response) => {
  await tracer.startActiveSpan('slow-operation', async (span) => {
    const delay = parseInt(req.query.delay as string) || 2000;
    span.setAttribute('delay_ms', delay);

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: '遅い処理を開始',
      attributes: { 'delay_ms': delay },
    });

    // 複数のネストした処理をシミュレート
    await tracer.startActiveSpan('step-1-initialization', async (step1) => {
      await new Promise(resolve => setTimeout(resolve, delay * 0.2));
      step1.end();
    });

    await tracer.startActiveSpan('step-2-processing', async (step2) => {
      await new Promise(resolve => setTimeout(resolve, delay * 0.5));
      step2.end();
    });

    await tracer.startActiveSpan('step-3-finalization', async (step3) => {
      await new Promise(resolve => setTimeout(resolve, delay * 0.3));
      step3.end();
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      message: 'Slow operation completed',
      delay_ms: delay,
    });
  });
});

// エラーAPI（エラーハンドリングテスト用）
app.get('/api/error', async (req: Request, res: Response) => {
  await tracer.startActiveSpan('error-operation', async (span) => {
    try {
      const errorType = (req.query.type as string) || 'generic';

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: 'エラーテストを実行',
        attributes: { 'error.type': errorType },
      });

      // 意図的なエラーを発生
      if (errorType === 'validation') {
        throw new Error('Validation failed: Invalid input data');
      } else if (errorType === 'auth') {
        throw new Error('Authentication failed: Invalid token');
      } else if (errorType === 'timeout') {
        throw new Error('Operation timed out');
      } else {
        throw new Error('Generic error occurred');
      }
    } catch (error) {
      const err = error as Error;

      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });

      errorCounter.add(1, {
        'error.type': err.message.split(':')[0].trim(),
        'http.route': '/api/error',
      });

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: 'エラーが発生しました',
        attributes: {
          'error.type': err.name,
          'error.message': err.message,
          'error.stack': err.stack || '',
        },
      });

      res.status(500).json({
        error: err.message,
        type: req.query.type || 'generic',
      });
    } finally {
      span.end();
    }
  });
});

// ============================================================
// エラーハンドラー
// ============================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: '未処理のエラー',
    attributes: {
      'error.type': err.name,
      'error.message': err.message,
      'error.stack': err.stack || '',
      'http.method': req.method,
      'http.url': req.url,
    },
  });

  errorCounter.add(1, {
    'error.type': 'UnhandledError',
    'http.method': req.method,
  });

  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// サーバー起動
// ============================================================

const server = app.listen(PORT, () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     OpenTelemetry 統合サンプルアプリケーション             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🚀 サーバー起動: http://localhost:${PORT}`);
  console.log('\n【利用可能なエンドポイント】');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ GET  /              - ヘルスチェック                        │');
  console.log('│ GET  /api/users     - ユーザー一覧取得                      │');
  console.log('│ GET  /api/users/:id - ユーザー詳細取得                      │');
  console.log('│ POST /api/orders    - 注文作成                              │');
  console.log('│ GET  /api/slow      - 遅いAPI（?delay=ミリ秒）              │');
  console.log('│ GET  /api/error     - エラーAPI（?type=validation|auth等）  │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n【テスト方法】');
  console.log('curl http://localhost:3000/');
  console.log('curl http://localhost:3000/api/users');
  console.log('curl http://localhost:3000/api/users/1');
  console.log('curl http://localhost:3000/api/users/999');
  console.log('curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d \'{"userId":1,"items":["item1","item2"]}\'');
  console.log('curl http://localhost:3000/api/slow?delay=1000');
  console.log('curl http://localhost:3000/api/error?type=validation');
  console.log('\n⏳ Ctrl+C で終了\n');

  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'サーバーが起動しました',
    attributes: {
      'server.port': PORT,
      'server.address': 'localhost',
    },
  });
});

// グレースフルシャットダウン
process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());

async function shutdown(): Promise<void> {
  console.log('\n\n🛑 シャットダウン開始...');

  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'サーバーをシャットダウン中',
  });

  server.close(async () => {
    console.log('サーバー停止完了');
    await sdk.shutdown();
    console.log('OpenTelemetry SDK シャットダウン完了');
    console.log('👋 さようなら！\n');
    process.exit(0);
  });
}
