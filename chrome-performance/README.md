# Chrome DevTools Protocol (CDP) CLI

Bun で作成した Chrome DevTools Protocol のインタラクティブ CLI ツールです。
Chrome をプログラムから操作する方法を学習できます。

## CDP とは

Chrome DevTools Protocol (CDP) は、Chrome ブラウザを外部から制御するためのプロトコルです。

- DevTools で手動でできることを、すべてコードから自動化できる
- WebSocket を使った双方向通信
- Puppeteer や Playwright の内部でも使用されている

## セットアップ

```bash
bun install
```

## 使い方

### 1. Chrome を起動

まず、リモートデバッグを有効にした Chrome を起動します。

```bash
# macOS
bun run chrome

# または手動で
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

> **注意**: 既存の Chrome プロセスがある場合は、すべて終了してから起動してください。

### 2. CLI を起動

```bash
bun start
```

## 機能一覧

| 番号 | コマンド | 説明 | CDP メソッド |
|------|----------|------|--------------|
| 1 | ターゲット一覧 | Chrome の全タブ/拡張機能を表示 | `HTTP GET /json` |
| 2 | ターゲットに接続 | 選択したページに WebSocket 接続 | WebSocket 接続 |
| 3 | パフォーマンス情報 | メモリ、レンダリング時間等 | `Performance.getMetrics` |
| 4 | ページ情報 | URL、Origin、フレーム情報 | `Page.getFrameTree` |
| 5 | JavaScript 実行 | ページ内で任意の JS を実行 | `Runtime.evaluate` |
| 6 | ページナビゲート | 指定 URL に移動 | `Page.navigate` |
| 7 | スクリーンショット | ページの PNG を保存 | `Page.captureScreenshot` |
| 8 | コンソール監視 | console.log 等をリアルタイム表示 | `Runtime.consoleAPICalled` イベント |
| 9 | ネットワーク監視 | HTTP リクエスト/レスポンスを表示 | `Network.*` イベント |

## CDP の基本的な流れ

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ターゲット一覧取得                                        │
│    HTTP GET http://localhost:9222/json                      │
│    → 開いているタブの webSocketDebuggerUrl を取得            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. WebSocket 接続                                           │
│    ws://localhost:9222/devtools/page/{id}                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ドメインを有効化                                          │
│    { method: "Performance.enable" }                         │
│    { method: "Runtime.enable" }                             │
│    { method: "Network.enable" }                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. コマンド送信 / イベント受信                                │
│    送信: { id: 1, method: "Page.navigate", params: {...} }  │
│    受信: { id: 1, result: {...} }                           │
│    イベント: { method: "Network.requestWillBeSent", ... }   │
└─────────────────────────────────────────────────────────────┘
```

## CDP メッセージ形式

CDP は JSON-RPC ライクなプロトコルです。

### リクエスト

```json
{
  "id": 1,
  "method": "Page.navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

### レスポンス (成功)

```json
{
  "id": 1,
  "result": {
    "frameId": "..."
  }
}
```

### レスポンス (エラー)

```json
{
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Cannot navigate to invalid URL"
  }
}
```

### イベント (プッシュ通知)

```json
{
  "method": "Network.requestWillBeSent",
  "params": {
    "requestId": "...",
    "request": {
      "url": "https://example.com/api",
      "method": "GET"
    }
  }
}
```

## 主要な CDP ドメイン

| ドメイン | 説明 | 主なメソッド |
|----------|------|--------------|
| Page | ページ操作 | navigate, reload, captureScreenshot |
| Runtime | JS 実行 | evaluate, callFunctionOn |
| Network | ネットワーク | enable, getResponseBody |
| Performance | パフォーマンス | getMetrics, enable |
| DOM | DOM 操作 | getDocument, querySelector |
| Debugger | デバッグ | pause, resume, setBreakpoint |
| Profiler | プロファイリング | start, stop, getBestEffortCoverage |

## 参考リンク

- [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/)
- [Chrome DevTools Protocol - GitHub](https://github.com/nicolo-ribaudo/devtools-protocol)

## ライセンス

MIT
