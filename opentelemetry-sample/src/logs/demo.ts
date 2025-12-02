/**
 * ========================================
 * OpenTelemetry Logs（ログ）デモ
 * ========================================
 *
 * 【Logsとは】
 * 構造化されたログデータを収集・エクスポートする仕組み。
 * 既存のログライブラリと統合し、トレースとの相関付けが可能。
 *
 * 【主要な概念】
 *
 * 1. LoggerProvider
 *    - Loggerを作成するためのファクトリ
 *    - LogRecordProcessorとExporterを設定
 *
 * 2. Logger
 *    - ログを出力するためのインターフェース
 *    - ライブラリ/モジュールごとに作成
 *
 * 3. LogRecord
 *    - 1つのログエントリ
 *    - タイムスタンプ、重要度、本文、属性を含む
 *
 * 4. SeverityNumber / SeverityText
 *    - ログの重要度レベル
 *    - TRACE, DEBUG, INFO, WARN, ERROR, FATAL
 *
 * 5. TraceContextとの相関
 *    - ログにTraceIdとSpanIdを含めることで
 *    - トレースとログを紐づけて分析可能
 *
 * 【データフォーマット（OTLP）】
 * {
 *   "resourceLogs": [{
 *     "resource": { "attributes": [...] },
 *     "scopeLogs": [{
 *       "scope": { "name": "...", "version": "..." },
 *       "logRecords": [{
 *         "timeUnixNano": "1234567890000000000",
 *         "observedTimeUnixNano": "...",
 *         "severityNumber": 9,   // 1-24 (TRACE=1-4, DEBUG=5-8, INFO=9-12, ...)
 *         "severityText": "INFO",
 *         "body": { "stringValue": "User logged in" },
 *         "attributes": [
 *           { "key": "user.id", "value": { "intValue": "12345" } }
 *         ],
 *         "traceId": "abc123...",  // トレースとの相関
 *         "spanId": "def456..."
 *       }]
 *     }]
 *   }]
 * }
 */

import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';
import { setupDevelopment } from '../instrumentation/setup';

// SDKを初期化
const sdk = setupDevelopment('logs-demo');

// Loggerを取得
const logger = logs.getLogger('logs-demo', '1.0.0');

// Tracerを取得（ログとトレースの相関デモ用）
const tracer = trace.getTracer('logs-demo', '1.0.0');

// ============================================================
// 重要度レベル（SeverityNumber）の定義
// ============================================================
/**
 * OpenTelemetryのSeverityNumberは1-24の範囲
 *
 * TRACE:  1-4   (最も詳細なデバッグ情報)
 * DEBUG:  5-8   (デバッグ情報)
 * INFO:   9-12  (一般的な情報)
 * WARN:  13-16  (警告)
 * ERROR: 17-20  (エラー)
 * FATAL: 21-24  (致命的エラー)
 *
 * 各レベル内の数字は細分化に使用（例: INFO1=9, INFO2=10, INFO3=11, INFO4=12）
 */

// ============================================================
// デモ関数
// ============================================================

/**
 * 基本的なログ出力
 */
async function basicLoggingDemo(): Promise<void> {
  console.log('\n📝 基本的なログ出力デモ\n');

  // TRACEレベル（最も詳細）
  logger.emit({
    severityNumber: SeverityNumber.TRACE,
    severityText: 'TRACE',
    body: '関数 processData() に入りました',
    attributes: {
      'function.name': 'processData',
    },
  });
  console.log('TRACE: 関数 processData() に入りました');

  // DEBUGレベル
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: 'データベース接続パラメータを設定中',
    attributes: {
      'db.host': 'localhost',
      'db.port': 5432,
    },
  });
  console.log('DEBUG: データベース接続パラメータを設定中');

  // INFOレベル
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'ユーザーがログインしました',
    attributes: {
      'user.id': 12345,
      'user.email': 'user@example.com',
      'auth.method': 'password',
    },
  });
  console.log('INFO: ユーザーがログインしました');

  // WARNレベル
  logger.emit({
    severityNumber: SeverityNumber.WARN,
    severityText: 'WARN',
    body: 'APIレート制限に近づいています',
    attributes: {
      'rate_limit.current': 950,
      'rate_limit.max': 1000,
      'rate_limit.remaining': 50,
    },
  });
  console.log('WARN: APIレート制限に近づいています');

  // ERRORレベル
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: 'データベース接続に失敗しました',
    attributes: {
      'error.type': 'ConnectionError',
      'error.message': 'Connection refused',
      'db.host': 'db.example.com',
    },
  });
  console.log('ERROR: データベース接続に失敗しました');

  // FATALレベル
  logger.emit({
    severityNumber: SeverityNumber.FATAL,
    severityText: 'FATAL',
    body: 'アプリケーションの起動に失敗しました',
    attributes: {
      'error.type': 'StartupError',
      'component': 'main',
    },
  });
  console.log('FATAL: アプリケーションの起動に失敗しました');
}

/**
 * 構造化ログの例
 */
async function structuredLoggingDemo(): Promise<void> {
  console.log('\n📝 構造化ログデモ\n');
  console.log('構造化ログにより、ログデータの検索・分析が容易になります。\n');

  // HTTPリクエストログ
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'HTTPリクエスト処理完了',
    attributes: {
      // HTTP関連の標準属性
      'http.method': 'POST',
      'http.url': '/api/orders',
      'http.status_code': 201,
      'http.request.body.size': 1024,
      'http.response.body.size': 256,
      'http.duration_ms': 45,
      // カスタム属性
      'order.id': 'ORD-2024-001',
      'customer.id': 'CUST-12345',
    },
  });
  console.log('HTTP POST /api/orders -> 201 (45ms)');

  // データベースクエリログ
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: 'SQLクエリ実行',
    attributes: {
      'db.system': 'postgresql',
      'db.name': 'orders_db',
      'db.statement': 'INSERT INTO orders (customer_id, total) VALUES ($1, $2)',
      'db.operation': 'INSERT',
      'db.table': 'orders',
      'db.duration_ms': 12,
      'db.rows_affected': 1,
    },
  });
  console.log('DB INSERT INTO orders (12ms, 1 row affected)');

  // キャッシュ操作ログ
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: 'キャッシュヒット',
    attributes: {
      'cache.type': 'redis',
      'cache.operation': 'GET',
      'cache.key': 'user:12345:profile',
      'cache.hit': true,
      'cache.ttl_seconds': 3600,
    },
  });
  console.log('Cache HIT: user:12345:profile');

  // 外部API呼び出しログ
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: '外部API呼び出し',
    attributes: {
      'external.service': 'payment-gateway',
      'external.endpoint': '/v1/charges',
      'external.method': 'POST',
      'external.status_code': 200,
      'external.duration_ms': 320,
      'payment.amount': 9900,
      'payment.currency': 'JPY',
    },
  });
  console.log('External API: payment-gateway/v1/charges (320ms)');
}

/**
 * トレースとログの相関デモ
 */
async function traceCorrelationDemo(): Promise<void> {
  console.log('\n📝 トレースとログの相関デモ\n');
  console.log('ログにトレース情報を含めることで、');
  console.log('分散システム全体のログを追跡できます。\n');

  // アクティブスパンを作成
  await tracer.startActiveSpan('process-order', async (span) => {
    const spanContext = span.spanContext();

    console.log(`TraceID: ${spanContext.traceId}`);
    console.log(`SpanID: ${spanContext.spanId}\n`);

    // ログ出力（自動的にトレースコンテキストが含まれる）
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: '注文処理を開始',
      attributes: {
        'order.id': 'ORD-2024-001',
      },
    });
    console.log('INFO: 注文処理を開始（TraceID含む）');

    await simulateWork(50);

    // 子スパン内でのログ
    await tracer.startActiveSpan('validate-payment', async (childSpan) => {
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: '支払い検証中',
        attributes: {
          'payment.method': 'credit_card',
          'payment.amount': 9900,
        },
      });
      console.log('INFO: 支払い検証中（親子両方のSpanIDを持つ）');

      await simulateWork(30);
      childSpan.end();
    });

    // エラーログ（トレース付き）
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: '在庫不足エラー',
      attributes: {
        'error.type': 'InsufficientStock',
        'product.id': 'PROD-789',
        'product.requested': 5,
        'product.available': 2,
      },
    });
    console.log('ERROR: 在庫不足エラー（TraceID含む）');

    span.end();
  });

  console.log('\n→ これにより、トレースUIからログを参照したり、');
  console.log('   ログ検索からトレースにジャンプできます。');
}

/**
 * 例外のログ記録
 */
async function exceptionLoggingDemo(): Promise<void> {
  console.log('\n📝 例外ログデモ\n');

  try {
    throw new Error('Something went wrong!');
  } catch (error) {
    const err = error as Error;

    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: '例外が発生しました',
      attributes: {
        'exception.type': err.name,
        'exception.message': err.message,
        'exception.stacktrace': err.stack || '',
        // コンテキスト情報
        'request.id': 'REQ-12345',
        'user.id': 67890,
      },
    });
    console.log(`ERROR: ${err.name} - ${err.message}`);
  }
}

/**
 * コンテキスト情報の追加（リクエストコンテキスト）
 */
async function requestContextDemo(): Promise<void> {
  console.log('\n📝 リクエストコンテキストデモ\n');
  console.log('リクエスト全体で共通の属性を含めることで、');
  console.log('関連するログを簡単に検索できます。\n');

  // リクエストコンテキスト（通常はミドルウェアで設定）
  const requestContext = {
    'request.id': 'req-abc-123',
    'user.id': 12345,
    'user.role': 'admin',
    'session.id': 'sess-xyz-789',
  };

  // リクエスト開始
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'リクエスト受信',
    attributes: {
      ...requestContext,
      'http.method': 'GET',
      'http.url': '/api/users',
    },
  });
  console.log('INFO: リクエスト受信 (request.id: req-abc-123)');

  // 処理中のログ
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: '認証チェック完了',
    attributes: {
      ...requestContext,
      'auth.status': 'success',
    },
  });
  console.log('DEBUG: 認証チェック完了');

  // データベースアクセス
  logger.emit({
    severityNumber: SeverityNumber.DEBUG,
    severityText: 'DEBUG',
    body: 'ユーザー情報を取得',
    attributes: {
      ...requestContext,
      'db.table': 'users',
      'db.duration_ms': 15,
    },
  });
  console.log('DEBUG: ユーザー情報を取得');

  // リクエスト完了
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'リクエスト完了',
    attributes: {
      ...requestContext,
      'http.status_code': 200,
      'http.duration_ms': 78,
    },
  });
  console.log('INFO: リクエスト完了 (200, 78ms)');

  console.log('\n→ request.id="req-abc-123" で全ログを検索可能');
}

/**
 * 処理をシミュレート
 */
function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * メイン実行
 */
async function main(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        OpenTelemetry Logs（ログ）デモ                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n【重要度レベル（SeverityNumber）】');
  console.log('┌───────────┬───────────┬────────────────────────────────┐');
  console.log('│ Level     │ Number    │ 用途                           │');
  console.log('├───────────┼───────────┼────────────────────────────────┤');
  console.log('│ TRACE     │ 1-4       │ 最も詳細なデバッグ情報         │');
  console.log('│ DEBUG     │ 5-8       │ デバッグ情報                   │');
  console.log('│ INFO      │ 9-12      │ 一般的な情報                   │');
  console.log('│ WARN      │ 13-16     │ 警告                           │');
  console.log('│ ERROR     │ 17-20     │ エラー                         │');
  console.log('│ FATAL     │ 21-24     │ 致命的エラー                   │');
  console.log('└───────────┴───────────┴────────────────────────────────┘');

  try {
    await basicLoggingDemo();
    await structuredLoggingDemo();
    await traceCorrelationDemo();
    await exceptionLoggingDemo();
    await requestContextDemo();

    console.log('\n✅ 全てのデモが完了しました！\n');
    console.log('【出力の見方】');
    console.log('- severityNumber: 重要度の数値');
    console.log('- severityText: 重要度のテキスト');
    console.log('- body: ログメッセージ本文');
    console.log('- attributes: 構造化された属性');
    console.log('- traceId/spanId: トレースとの相関');
    console.log('- timeUnixNano: タイムスタンプ（ナノ秒）');

    // ログがエクスポートされるのを待つ
    console.log('\n⏳ ログのエクスポートを待機中...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } finally {
    await sdk.shutdown();
    console.log('\n👋 SDK シャットダウン完了');
  }
}

main().catch(console.error);
