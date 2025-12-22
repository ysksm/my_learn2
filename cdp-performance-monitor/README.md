# CDP Performance Monitor

Chrome DevTools Protocol (CDP) を使用したブラウザパフォーマンス監視ダッシュボード。
CDPの仕組みとブラウザパフォーマンス最適化を学ぶための教育用プロジェクトです。

## 概要

このプロジェクトでは以下を学ぶことができます:

- **CPU プロファイリング**: JavaScript の実行時間を分析し、ボトルネックを特定
- **メモリ分析**: ヒープスナップショットとメモリリーク検出
- **ネットワーク監視**: リクエストの追跡とウォーターフォール分析
- **Core Web Vitals**: LCP, FID, CLS などのパフォーマンス指標

## セットアップ

### 1. 依存関係のインストール

```bash
cd cdp-performance-monitor
npm run install:all
```

### 2. Chrome を Remote Debugging モードで起動

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### 3. バックエンドを起動

```bash
cd backend
npm run dev
```

サーバーが `http://localhost:3001` で起動します。

### 4. フロントエンドを起動（別ターミナル）

```bash
cd frontend
npm run dev
```

ダッシュボードが `http://localhost:5173` で起動します。

## 使い方

1. Chrome を remote debugging モードで起動
2. 分析したいページを Chrome で開く
3. ダッシュボードで「Start Collecting」をクリック
4. 各タブでリアルタイムのメトリクスを確認

## 機能

### CPU タブ
- リアルタイムの Script/Task Duration 監視
- CPU プロファイリング（開始/停止）
- トップ関数の表示

### Memory タブ
- ヒープ使用量のリアルタイムチャート
- 強制 GC 実行
- ヒープスナップショット取得
- DOM ノード数・イベントリスナー数の監視

### Network タブ
- ネットワークリクエストのリアルタイム追跡
- リソースタイプ別の集計
- 転送サイズの監視

### Web Vitals タブ
- Core Web Vitals (LCP, FCP, TTFB) の測定
- 閾値に基づく評価（Good/Needs Improvement/Poor）
- ページリロード機能

## Chrome DevTools Protocol について

CDP は Chrome ブラウザを制御するための WebSocket ベースのプロトコルです。

### 主要なドメイン

| ドメイン | 用途 |
|---------|------|
| Performance | パフォーマンスメトリクスの取得 |
| Profiler | CPU プロファイリング |
| HeapProfiler | ヒープスナップショット、メモリ分析 |
| Network | ネットワークリクエストの監視 |
| Page | ページライフサイクルイベント |
| DOM | DOM 構造の検査 |
| Runtime | JavaScript 実行環境の制御 |

### CDP の使用例

```typescript
// CDP に接続
const client = await CDP({ port: 9222 });

// Performance メトリクスを取得
await client.Performance.enable();
const { metrics } = await client.Performance.getMetrics();

// CPU プロファイリング
await client.Profiler.enable();
await client.Profiler.start();
// ... 処理 ...
const { profile } = await client.Profiler.stop();

// ネットワーク監視
await client.Network.enable();
client.on('Network.requestWillBeSent', (params) => {
  console.log('Request:', params.request.url);
});
```

## プロジェクト構造

```
cdp-performance-monitor/
├── package.json
├── README.md
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express + WebSocket サーバー
│   │   ├── types.ts          # 型定義
│   │   ├── cdp/
│   │   │   ├── client.ts     # CDP 接続クライアント
│   │   │   └── domains/      # 各ドメインのラッパー
│   │   ├── collectors/       # メトリクス収集
│   │   └── routes/           # REST API エンドポイント
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── hooks/
    │   │   └── useWebSocket.ts
    │   └── components/
    │       ├── Dashboard.tsx
    │       ├── CpuPanel.tsx
    │       ├── MemoryPanel.tsx
    │       ├── NetworkPanel.tsx
    │       └── VitalsPanel.tsx
    └── package.json
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /health | ヘルスチェック |
| GET | /api/connection | CDP 接続状態 |
| GET | /api/metrics | 現在のメトリクス |
| POST | /api/profiling/cpu/start | CPU プロファイリング開始 |
| POST | /api/profiling/cpu/stop | CPU プロファイリング停止 |
| POST | /api/memory/snapshot | ヒープスナップショット |
| POST | /api/memory/gc | 強制 GC |
| GET | /api/network/requests | ネットワークリクエスト一覧 |
| POST | /api/page/reload | ページリロード |

## ドキュメント

詳細なガイドは [docs/guide.md](docs/guide.md) を参照してください。

- CDP の仕組み
- リモート Chrome 接続
- 各ドメインの解説
- トラブルシューティング

## 学習リソース

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [web.dev - Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)

## 技術スタック

**バックエンド**
- Express.js
- WebSocket (ws)
- chrome-remote-interface
- TypeScript

**フロントエンド**
- React 19
- Vite
- Recharts
- TypeScript
