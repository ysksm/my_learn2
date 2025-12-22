/**
 * ========================================
 * CDP Performance Monitor サーバー
 * ========================================
 *
 * Chrome DevTools Protocol を使用してブラウザの
 * パフォーマンスメトリクスを収集・配信するサーバー。
 *
 * 【アーキテクチャ】
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │                    Browser                          │
 *   │              (--remote-debugging-port=9222)         │
 *   └─────────────────────────┬───────────────────────────┘
 *                             │ CDP (WebSocket)
 *   ┌─────────────────────────▼───────────────────────────┐
 *   │                CDP Monitor Server                    │
 *   │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
 *   │  │ CDP Client│  │ Collectors│  │   Routes  │       │
 *   │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
 *   │        └──────────────┼──────────────┘             │
 *   │                       │                             │
 *   │              ┌────────▼────────┐                   │
 *   │              │ WebSocket Server│                   │
 *   │              │   (Real-time)   │                   │
 *   │              └────────┬────────┘                   │
 *   └───────────────────────┼────────────────────────────┘
 *                           │
 *   ┌───────────────────────▼────────────────────────────┐
 *   │              Frontend Dashboard                     │
 *   │         (React + Recharts)                         │
 *   └────────────────────────────────────────────────────┘
 *
 * 【使用方法】
 *
 * 1. Chrome を remote debugging モードで起動:
 *    chrome --remote-debugging-port=9222
 *
 * 2. このサーバーを起動:
 *    npm run dev
 *
 * 3. フロントエンドダッシュボードにアクセス
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { CDPClient } from './cdp/client';
import { MetricsCollector } from './collectors';
import { healthRouter, createApiRouter } from './routes';
import type { ClientAction, WebSocketMessage, ConnectionStatus } from './types';

// 環境設定
const PORT = parseInt(process.env.PORT || '3001');
const CDP_HOST = process.env.CDP_HOST || 'localhost';
const CDP_PORT = parseInt(process.env.CDP_PORT || '9222');

// Express アプリケーション
const app = express();
app.use(cors());
app.use(express.json());

// HTTP サーバー
const server = http.createServer(app);

// WebSocket サーバー
const wss = new WebSocketServer({ server, path: '/ws' });

// CDP クライアントとコレクター
let cdpClient: CDPClient | null = null;
let metricsCollector: MetricsCollector | null = null;
let connectionStatus: ConnectionStatus = { connected: false };

// WebSocket クライアント管理
const wsClients = new Set<WebSocket>();

/**
 * 全 WebSocket クライアントにメッセージをブロードキャスト
 */
function broadcast<T>(message: WebSocketMessage<T>): void {
  const data = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

/**
 * CDP に接続
 */
async function connectToCDP(): Promise<void> {
  try {
    cdpClient = new CDPClient({ host: CDP_HOST, port: CDP_PORT });

    cdpClient.on('connected', (status: ConnectionStatus) => {
      connectionStatus = status;
      broadcast({ type: 'connection_status', data: status });
      console.log('CDP に接続しました:', status.targetInfo?.title);
    });

    cdpClient.on('disconnected', () => {
      connectionStatus = { connected: false };
      broadcast({ type: 'connection_status', data: connectionStatus });
      console.log('CDP から切断されました');

      // 再接続を試みる
      setTimeout(connectToCDP, 5000);
    });

    await cdpClient.connect();

    // メトリクスコレクターを初期化
    metricsCollector = new MetricsCollector(cdpClient);
    await metricsCollector.enable();

    // メトリクスイベントを転送
    metricsCollector.on('metrics', (metrics) => {
      broadcast({ type: 'metrics', data: metrics });
    });

    metricsCollector.on('cpuProfilingStarted', () => {
      broadcast({ type: 'cpu_profile', data: { status: 'started' } });
    });

    metricsCollector.on('cpuProfilingStopped', (data) => {
      broadcast({ type: 'cpu_profile', data: { status: 'stopped', ...data } });
    });

    metricsCollector.on('heapSnapshotProgress', (progress) => {
      broadcast({ type: 'heap_snapshot_progress', data: progress });
    });

    metricsCollector.on('networkRequest', (request) => {
      broadcast({ type: 'network_request', data: request });
    });

    metricsCollector.on('lifecycleEvent', (event) => {
      broadcast({ type: 'vitals_update', data: event });
    });

  } catch (error) {
    console.warn('CDP への接続に失敗しました:', (error as Error).message);
    console.log('Chrome を以下のコマンドで起動してください:');
    console.log(`  chrome --remote-debugging-port=${CDP_PORT}`);
    console.log('\n5秒後に再接続を試みます...');
    setTimeout(connectToCDP, 5000);
  }
}

/**
 * WebSocket クライアントからのメッセージを処理
 */
async function handleClientMessage(ws: WebSocket, message: ClientAction): Promise<void> {
  const { action, payload } = message;

  if (!metricsCollector) {
    ws.send(JSON.stringify({ type: 'error', data: { message: 'CDP not connected' } }));
    return;
  }

  try {
    switch (action) {
      case 'start_metrics_collection': {
        const interval = (payload?.interval as number) || 1000;
        metricsCollector.startCollection(interval);
        ws.send(JSON.stringify({ type: 'metrics', data: { status: 'collection_started' } }));
        break;
      }

      case 'stop_metrics_collection':
        metricsCollector.stopCollection();
        ws.send(JSON.stringify({ type: 'metrics', data: { status: 'collection_stopped' } }));
        break;

      case 'start_cpu_profiling':
        await metricsCollector.startCpuProfiling();
        break;

      case 'stop_cpu_profiling': {
        const profile = await metricsCollector.stopCpuProfiling();
        const summary = metricsCollector.profiler.analyzePprofile(profile);
        ws.send(JSON.stringify({ type: 'cpu_profile', data: { profile, summary } }));
        break;
      }

      case 'take_heap_snapshot':
        // スナップショットは大きいのでイベントで段階的に送信
        await metricsCollector.takeHeapSnapshot();
        break;

      case 'collect_garbage':
        await metricsCollector.collectGarbage();
        ws.send(JSON.stringify({ type: 'metrics', data: { status: 'gc_completed' } }));
        break;

      case 'reload_page': {
        const ignoreCache = payload?.ignoreCache as boolean ?? false;
        await metricsCollector.reloadPage(ignoreCache);
        break;
      }

      case 'navigate': {
        const url = payload?.url as string;
        if (url) {
          await metricsCollector.navigateTo(url);
        }
        break;
      }

      case 'clear_network':
        metricsCollector.clearNetworkRequests();
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', data: { message: `Unknown action: ${action}` } }));
    }
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', data: { message: (error as Error).message } }));
  }
}

// WebSocket 接続ハンドラー
wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log('WebSocket クライアントが接続しました');

  // 現在の接続状態を送信
  ws.send(JSON.stringify({ type: 'connection_status', data: connectionStatus }));

  // 最新のメトリクスがあれば送信
  if (metricsCollector) {
    const lastMetrics = metricsCollector.getLastMetrics();
    if (lastMetrics) {
      ws.send(JSON.stringify({ type: 'metrics', data: lastMetrics }));
    }
  }

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString()) as ClientAction;
      await handleClientMessage(ws, message);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message format' } }));
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('WebSocket クライアントが切断しました');
  });
});

// ルート設定
app.use('/health', healthRouter);
app.use('/api', createApiRouter(metricsCollector));

// 接続状態エンドポイント
app.get('/api/connection', (req: Request, res: Response) => {
  res.json(connectionStatus);
});

// エラーハンドラー
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// サーバー起動
server.listen(PORT, async () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       CDP Performance Monitor - 学習用サーバー             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🚀 サーバー起動: http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`💓 Health: http://localhost:${PORT}/health`);
  console.log('\n【Chrome の起動方法】');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log(`│ chrome --remote-debugging-port=${CDP_PORT}                          │`);
  console.log('│                                                             │');
  console.log('│ macOS:                                                      │');
  console.log(`│ /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\    │`);
  console.log(`│   --remote-debugging-port=${CDP_PORT}                                │`);
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n【API エンドポイント】');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ GET  /api/connection      - CDP 接続状態                    │');
  console.log('│ GET  /api/metrics         - 現在のメトリクス                │');
  console.log('│ POST /api/profiling/cpu/start  - CPU プロファイリング開始   │');
  console.log('│ POST /api/profiling/cpu/stop   - CPU プロファイリング停止   │');
  console.log('│ POST /api/memory/snapshot      - ヒープスナップショット     │');
  console.log('│ POST /api/memory/gc            - ガベージコレクション       │');
  console.log('│ GET  /api/network/requests     - ネットワークリクエスト     │');
  console.log('│ POST /api/page/reload          - ページリロード             │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n⏳ Ctrl+C で終了\n');

  // CDP に接続
  await connectToCDP();
});

// グレースフルシャットダウン
async function shutdown(): Promise<void> {
  console.log('\n\n🛑 シャットダウン開始...');

  // メトリクス収集を停止
  if (metricsCollector) {
    metricsCollector.stopCollection();
    await metricsCollector.disable();
  }

  // CDP 切断
  if (cdpClient) {
    await cdpClient.disconnect();
  }

  // WebSocket クライアントを切断
  wsClients.forEach((client) => client.close());

  // サーバーを停止
  server.close(() => {
    console.log('サーバー停止完了');
    console.log('👋 さようなら！\n');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
