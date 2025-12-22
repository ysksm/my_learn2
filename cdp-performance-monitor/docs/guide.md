# CDP Performance Monitor ガイド

Chrome DevTools Protocol (CDP) を使用したブラウザパフォーマンス監視の仕組みと使い方を解説します。

## 目次

1. [Chrome DevTools Protocol とは](#chrome-devtools-protocol-とは)
2. [アーキテクチャ](#アーキテクチャ)
3. [セットアップ](#セットアップ)
4. [使い方](#使い方)
5. [リモートChrome接続](#リモートchrome接続)
6. [CDP ドメイン解説](#cdp-ドメイン解説)
7. [トラブルシューティング](#トラブルシューティング)

---

## Chrome DevTools Protocol とは

Chrome DevTools Protocol (CDP) は、Chrome ブラウザをプログラムで制御するための WebSocket ベースのプロトコルです。

### 特徴

- **DevTools と同じ情報にアクセス**: ブラウザの開発者ツールで見られる情報はすべて CDP 経由で取得可能
- **リアルタイム監視**: WebSocket によるイベント駆動で、リアルタイムにブラウザの状態を監視
- **自動化**: ページ操作、スクリーンショット、PDF 生成なども可能

### 仕組み

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Browser                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tab 1     │  │   Tab 2     │  │   Tab 3     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                 │
│                  ┌───────▼───────┐                         │
│                  │  DevTools     │                         │
│                  │  Protocol     │                         │
│                  │  Server       │                         │
│                  └───────┬───────┘                         │
└──────────────────────────┼─────────────────────────────────┘
                           │ WebSocket (port 9222)
                           ▼
                  ┌─────────────────┐
                  │  CDP Client     │
                  │  (このツール)    │
                  └─────────────────┘
```

Chrome を `--remote-debugging-port=9222` で起動すると、ポート 9222 で WebSocket サーバーが起動し、外部からの接続を受け付けます。

---

## アーキテクチャ

このツールは以下の構成で動作します：

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Browser                           │
│              (--remote-debugging-port=9222)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ CDP (WebSocket)
┌─────────────────────────▼───────────────────────────────────┐
│                 Backend Server (Express)                     │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ CDP Client  │──▶│ Collectors  │──▶│  WebSocket  │       │
│  │             │   │             │   │   Server    │       │
│  │ - Performance│   │ - CPU       │   │             │       │
│  │ - Profiler  │   │ - Memory    │   │             │       │
│  │ - HeapProfiler│  │ - Network   │   │             │       │
│  │ - Network   │   │ - Vitals    │   │             │       │
│  │ - Page      │   │             │   │             │       │
│  └─────────────┘   └─────────────┘   └──────┬──────┘       │
│                                             │              │
│  ┌─────────────────────────────────────────┐│              │
│  │           REST API Routes               ││              │
│  │  /api/metrics, /api/profiling, etc.     ││              │
│  └─────────────────────────────────────────┘│              │
└─────────────────────────────────────────────┼──────────────┘
                                              │ WebSocket
┌─────────────────────────────────────────────▼──────────────┐
│                 Frontend Dashboard (React)                  │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  CPU Panel  │   │Memory Panel │   │Network Panel│       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│  ┌─────────────┐   ┌─────────────┐                         │
│  │Vitals Panel │   │  Overview   │                         │
│  └─────────────┘   └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### コンポーネント説明

| コンポーネント | 役割 |
|--------------|------|
| CDP Client | Chrome との WebSocket 接続を管理 |
| Collectors | 各 CDP ドメインからメトリクスを収集 |
| WebSocket Server | フロントエンドにリアルタイムでデータを配信 |
| REST API | オンデマンドでの操作（プロファイリング開始など） |
| Frontend | 収集したメトリクスを可視化 |

---

## セットアップ

### 前提条件

- Node.js 18 以上
- Google Chrome

### インストール

```bash
cd cdp-performance-monitor

# 全ての依存関係をインストール
npm run install:all
```

### Chrome の起動

Chrome を remote debugging モードで起動する必要があります。

#### macOS

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

#### Windows

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\chrome-debug-profile
```

#### Linux

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

> **注意**: `--user-data-dir` を指定すると、既存の Chrome セッションとは別のプロファイルで起動します。
> 既存の Chrome が起動している場合、同じポートを使用できないため、別プロファイルでの起動が必要です。

### サーバーの起動

```bash
# バックエンド起動（ターミナル1）
cd backend
npm run dev

# フロントエンド起動（ターミナル2）
cd frontend
npm run dev
```

### アクセス

- **ダッシュボード**: http://localhost:5173
- **バックエンド API**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

---

## 使い方

### 基本的な流れ

1. Chrome を remote debugging モードで起動
2. 監視したいページを Chrome で開く
3. ダッシュボード（http://localhost:5173）にアクセス
4. 「Start Collecting」をクリックしてメトリクス収集を開始
5. 各タブでリアルタイムのメトリクスを確認

### CPU プロファイリング

1. CPU タブを開く
2. 「Start Profiling」をクリック
3. Chrome で分析したい操作を実行
4. 「Stop Profiling」をクリック
5. Top Functions で最も時間を消費している関数を確認

### メモリリーク検出

1. Memory タブを開く
2. 「Force GC」をクリックしてガベージコレクションを実行
3. 現在のヒープサイズを確認
4. Chrome でメモリリークが疑われる操作を繰り返し実行
5. 再度「Force GC」をクリック
6. ヒープサイズが増加し続けていればリークの可能性あり

### ネットワーク分析

1. Network タブを開く
2. Chrome でページを操作
3. リクエスト一覧でリソースの読み込み状況を確認
4. リソースタイプ別のサマリーで最適化ポイントを特定

### Core Web Vitals

1. Web Vitals タブを開く
2. 「Reload Page」または「Hard Reload」でページを再読み込み
3. LCP, FCP, TTFB の値と評価を確認

---

## リモートChrome接続

ローカルマシンからリモートマシンで動作している Chrome のパフォーマンスを監視できます。

### 構成図

```
┌─────────────────────────────────────────┐
│         リモートマシン                   │
│         (192.168.1.100)                 │
│                                         │
│  Chrome Browser                         │
│  --remote-debugging-port=9222           │
│  --remote-debugging-address=0.0.0.0     │
│                                         │
└────────────────┬────────────────────────┘
                 │ TCP/9222
                 │ (ネットワーク経由)
                 ▼
┌─────────────────────────────────────────┐
│         ローカルマシン                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ CDP Monitor Backend              │   │
│  │ CDP_HOST=192.168.1.100           │   │
│  │ CDP_PORT=9222                    │   │
│  └───────────────┬─────────────────┘   │
│                  │                      │
│  ┌───────────────▼─────────────────┐   │
│  │ Frontend Dashboard               │   │
│  │ http://localhost:5173            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### リモートマシンの設定

1. **Chrome を起動**

```bash
chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0
```

`--remote-debugging-address=0.0.0.0` により、全てのネットワークインターフェースからの接続を許可します。

2. **ファイアウォール設定**

ポート 9222 への接続を許可してください。

```bash
# Linux (ufw)
sudo ufw allow 9222/tcp

# Linux (firewalld)
sudo firewall-cmd --add-port=9222/tcp --permanent
sudo firewall-cmd --reload
```

> **セキュリティ警告**: リモートデバッグポートを外部に公開すると、
> そのマシンの Chrome を完全に制御できてしまいます。
> 信頼できるネットワーク内でのみ使用し、使用後は必ず Chrome を終了してください。

### ローカルマシンの設定

環境変数でリモートホストを指定してバックエンドを起動：

```bash
cd backend

# 方法1: コマンドラインで指定
CDP_HOST=192.168.1.100 CDP_PORT=9222 npm run dev

# 方法2: .env ファイルを作成
echo "CDP_HOST=192.168.1.100" > .env
echo "CDP_PORT=9222" >> .env
npm run dev
```

### 接続確認

リモート Chrome に接続できるか確認：

```bash
curl http://192.168.1.100:9222/json/version
```

---

## CDP ドメイン解説

### Performance ドメイン

ブラウザのパフォーマンスメトリクスを取得します。

```javascript
// メトリクスを取得
await client.send('Performance.getMetrics');
```

**取得できる主なメトリクス:**

| メトリクス | 説明 |
|-----------|------|
| TaskDuration | スクリプトタスクの実行時間（秒） |
| ScriptDuration | JavaScript の実行時間（秒） |
| LayoutDuration | レイアウト計算時間（秒） |
| JSHeapUsedSize | 使用中の JS ヒープサイズ（バイト） |
| JSHeapTotalSize | 合計 JS ヒープサイズ（バイト） |
| Nodes | DOM ノード数 |
| LayoutCount | レイアウト実行回数 |

### Profiler ドメイン（CPU プロファイリング）

JavaScript の実行時間を詳細に分析します。

```javascript
// プロファイリング開始
await client.send('Profiler.enable');
await client.send('Profiler.start');

// ... 分析したい処理 ...

// プロファイリング停止
const { profile } = await client.send('Profiler.stop');
```

**プロファイル結果の構造:**

- `nodes`: コールスタックのノード（各関数の情報）
- `samples`: サンプリングされたノード ID の配列
- `timeDeltas`: 各サンプル間の時間差（マイクロ秒）

### HeapProfiler ドメイン（メモリ分析）

JavaScript ヒープのメモリ分析を行います。

```javascript
// ヒープスナップショット取得
await client.send('HeapProfiler.enable');
await client.send('HeapProfiler.takeHeapSnapshot');

// ガベージコレクション強制実行
await client.send('HeapProfiler.collectGarbage');
```

**メモリリーク検出手順:**

1. 初期スナップショットを取得
2. メモリリークが疑われる操作を実行
3. GC を実行
4. 2回目のスナップショットを取得
5. 2つのスナップショットを比較し、増加したオブジェクトを特定

### Network ドメイン

ネットワークリクエストを監視します。

```javascript
await client.send('Network.enable');

// イベントをリッスン
client.on('Network.requestWillBeSent', (params) => {
  console.log('Request:', params.request.url);
});

client.on('Network.responseReceived', (params) => {
  console.log('Response:', params.response.status);
});
```

**タイミング情報:**

| フェーズ | 説明 |
|---------|------|
| DNS | ドメイン名解決時間 |
| Connect | TCP 接続確立時間 |
| SSL | TLS ハンドシェイク時間 |
| TTFB | Time to First Byte（最初のバイト受信まで） |
| Download | コンテンツダウンロード時間 |

### Page ドメイン

ページのライフサイクルイベントを監視します。

```javascript
await client.send('Page.enable');

client.on('Page.lifecycleEvent', (params) => {
  console.log('Event:', params.name, params.timestamp);
});
```

**主なライフサイクルイベント:**

| イベント | 説明 |
|---------|------|
| DOMContentLoaded | DOM ツリーの構築完了 |
| load | 全リソースのロード完了 |
| firstPaint | 最初の描画 |
| firstContentfulPaint | 最初のコンテンツ描画（FCP） |
| largestContentfulPaint | 最大コンテンツ描画（LCP） |

---

## トラブルシューティング

### Chrome に接続できない

**症状:**
```
CDP への接続に失敗しました: connect ECONNREFUSED 127.0.0.1:9222
```

**解決策:**

1. Chrome が remote debugging モードで起動しているか確認
```bash
curl http://localhost:9222/json/version
```

2. 既存の Chrome が起動している場合は終了するか、別プロファイルで起動
```bash
# macOS
pkill -f "Google Chrome"

# 別プロファイルで起動
chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### メトリクスが取得できない

**症状:** 接続はできるがメトリクスが 0 または undefined

**解決策:**

1. Chrome でページを開いているか確認
2. `Start Collecting` をクリックしたか確認
3. ダッシュボードと Chrome で同じタブを対象にしているか確認

### リモート接続できない

**症状:** リモートマシンの Chrome に接続できない

**解決策:**

1. リモートマシンで Chrome が正しく起動しているか確認
```bash
curl http://リモートIP:9222/json/version
```

2. `--remote-debugging-address=0.0.0.0` オプションを指定しているか確認

3. ファイアウォールでポート 9222 が開いているか確認

4. ネットワーク経路を確認
```bash
telnet リモートIP 9222
```

---

## 参考リンク

- [Chrome DevTools Protocol Documentation](https://chromedevtools.github.io/devtools-protocol/)
- [chrome-remote-interface (npm)](https://www.npmjs.com/package/chrome-remote-interface)
- [web.dev - Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
