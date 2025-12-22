/**
 * ============================================================================
 * Chrome DevTools Protocol (CDP) CLI - Bun版
 * ============================================================================
 *
 * インタラクティブにChromeを操作するCLIツール
 *
 * 使用前の準備:
 * 1. 普通に開いているChromeをすべて閉じる
 * 2. bun run chrome (または手動で --remote-debugging-port=9222 付きで起動)
 * 3. bun start
 */

import * as readline from "readline";

// =============================================================================
// 設定値
// =============================================================================

const CDP_PORT = 9222;
const CDP_HOST = "localhost";

// =============================================================================
// 型定義
// =============================================================================

interface Target {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

interface CDPMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

// =============================================================================
// CDPクライアントクラス
// =============================================================================

class CDPClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  private eventHandlers = new Map<string, ((params: unknown) => void)[]>();

  async getTargets(): Promise<Target[]> {
    const response = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json`);
    if (!response.ok) {
      throw new Error(`Failed to get targets: ${response.statusText}`);
    }
    return response.json();
  }

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error("WebSocket connection failed"));
      this.ws.onclose = () => console.log("\n[WebSocket切断]");
      this.ws.onmessage = (event) => {
        const message: CDPMessage = JSON.parse(event.data as string);

        if (message.id !== undefined) {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            this.pendingRequests.delete(message.id);
            if (message.error) {
              pending.reject(new Error(message.error.message));
            } else {
              pending.resolve(message.result);
            }
          }
        } else if (message.method) {
          const handlers = this.eventHandlers.get(message.method);
          if (handlers) {
            handlers.forEach((handler) => handler(message.params));
          }
        }
      };
    });
  }

  async send(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const id = ++this.messageId;
    const message = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));
    });
  }

  on(event: string, handler: (params: unknown) => void): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  off(event: string): void {
    this.eventHandlers.delete(event);
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// =============================================================================
// CLI ユーティリティ
// =============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function printHeader(title: string): void {
  console.log("\n" + "═".repeat(60));
  console.log(` ${title}`);
  console.log("═".repeat(60));
}

function printSection(title: string): void {
  console.log("\n" + "─".repeat(40));
  console.log(` ${title}`);
  console.log("─".repeat(40));
}

// =============================================================================
// メニューコマンド
// =============================================================================

let client: CDPClient | null = null;
let currentTarget: Target | null = null;
let consoleMonitoring = false;
let networkMonitoring = false;

async function showMainMenu(): Promise<void> {
  printHeader("CDP CLI メインメニュー");

  const connected = client?.isConnected() ?? false;

  console.log(`\n 接続状態: ${connected ? "接続中" : "未接続"}`);
  if (currentTarget) {
    console.log(` ターゲット: ${currentTarget.title}`);
  }

  console.log(`\n [1] ターゲット一覧を表示`);
  console.log(` [2] ターゲットに接続`);
  console.log(` [3] パフォーマンス情報を取得`);
  console.log(` [4] ページ情報を取得`);
  console.log(` [5] JavaScriptを実行`);
  console.log(` [6] ページをナビゲート`);
  console.log(` [7] スクリーンショットを撮影`);
  console.log(` [8] コンソール監視 ${consoleMonitoring ? "(ON)" : "(OFF)"}`);
  console.log(` [9] ネットワーク監視 ${networkMonitoring ? "(ON)" : "(OFF)"}`);
  console.log(` [0] 終了`);

  const choice = await prompt("\n> 選択: ");
  await handleMenuChoice(choice);
}

async function handleMenuChoice(choice: string): Promise<void> {
  switch (choice) {
    case "1":
      await showTargets();
      break;
    case "2":
      await connectToTarget();
      break;
    case "3":
      await showPerformance();
      break;
    case "4":
      await showPageInfo();
      break;
    case "5":
      await executeJs();
      break;
    case "6":
      await navigateTo();
      break;
    case "7":
      await takeScreenshot();
      break;
    case "8":
      await toggleConsoleMonitor();
      break;
    case "9":
      await toggleNetworkMonitor();
      break;
    case "0":
      console.log("\n終了します...\n");
      client?.close();
      rl.close();
      process.exit(0);
    default:
      console.log("\n無効な選択です");
  }

  await showMainMenu();
}

// =============================================================================
// コマンド実装
// =============================================================================

/**
 * [1] ターゲット一覧を表示
 *
 * HTTP GET /json でChromeの全ターゲットを取得
 */
async function showTargets(): Promise<void> {
  printSection("ターゲット一覧");

  try {
    const tempClient = new CDPClient();
    const targets = await tempClient.getTargets();

    console.log(`\n 全${targets.length}件:\n`);
    targets.forEach((target, index) => {
      const marker = target.type === "page" ? "*" : " ";
      console.log(`  ${marker}[${index}] ${target.type}`);
      console.log(`       タイトル: ${target.title || "(無題)"}`);
      console.log(`       URL: ${target.url}`);
    });

    console.log(`\n  (* = 接続可能なページ)`);
  } catch (error) {
    console.error("\n Chromeに接続できません。");
    console.error(" bun run chrome でChromeを起動してください。");
  }
}

/**
 * [2] ターゲットに接続
 *
 * 選択したターゲットにWebSocket接続
 */
async function connectToTarget(): Promise<void> {
  printSection("ターゲットに接続");

  try {
    const tempClient = new CDPClient();
    const targets = await tempClient.getTargets();
    const pages = targets.filter(
      (t) => t.type === "page" && t.webSocketDebuggerUrl
    );

    if (pages.length === 0) {
      console.log("\n 接続可能なページがありません。");
      return;
    }

    console.log("\n 接続可能なページ:\n");
    pages.forEach((page, index) => {
      console.log(`  [${index}] ${page.title || "(無題)"}`);
      console.log(`      ${page.url}`);
    });

    const choice = await prompt("\n> 番号を入力 (キャンセル: Enter): ");

    if (!choice) return;

    const index = parseInt(choice);
    if (isNaN(index) || index < 0 || index >= pages.length) {
      console.log("\n 無効な番号です。");
      return;
    }

    const target = pages[index];

    // 既存の接続を閉じる
    client?.close();

    // 新規接続
    client = new CDPClient();
    await client.connect(target.webSocketDebuggerUrl!);
    currentTarget = target;

    // 基本APIを有効化
    await client.send("Performance.enable");
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await client.send("Network.enable");

    console.log(`\n 接続成功: ${target.title}`);
  } catch (error) {
    console.error("\n 接続に失敗しました:", (error as Error).message);
  }
}

/**
 * [3] パフォーマンス情報を取得
 *
 * Performance.getMetrics でブラウザのメトリクスを取得
 */
async function showPerformance(): Promise<void> {
  printSection("パフォーマンス情報");

  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  try {
    const result = (await client.send("Performance.getMetrics")) as {
      metrics: Array<{ name: string; value: number }>;
    };

    console.log("\n メトリクス一覧:\n");

    const categories: Record<string, string[]> = {
      "メモリ": ["JSHeapUsedSize", "JSHeapTotalSize", "Documents", "Nodes"],
      "レンダリング": ["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration"],
      "スクリプト": ["ScriptDuration", "TaskDuration", "JSEventListeners"],
    };

    for (const [category, metricNames] of Object.entries(categories)) {
      console.log(`  [${category}]`);
      for (const name of metricNames) {
        const metric = result.metrics.find((m) => m.name === name);
        if (metric) {
          let value: string;
          if (name.includes("Size")) {
            value = `${(metric.value / 1024 / 1024).toFixed(2)} MB`;
          } else if (name.includes("Duration")) {
            value = `${(metric.value * 1000).toFixed(2)} ms`;
          } else {
            value = metric.value.toFixed(0);
          }
          console.log(`    ${name}: ${value}`);
        }
      }
      console.log("");
    }
  } catch (error) {
    console.error("\n エラー:", (error as Error).message);
  }
}

/**
 * [4] ページ情報を取得
 *
 * Page.getFrameTree でページ構造を取得
 */
async function showPageInfo(): Promise<void> {
  printSection("ページ情報");

  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  try {
    const frameTree = (await client.send("Page.getFrameTree")) as {
      frameTree: {
        frame: {
          id: string;
          url: string;
          securityOrigin: string;
          mimeType: string;
        };
      };
    };

    const frame = frameTree.frameTree.frame;

    console.log("\n 現在のページ:\n");
    console.log(`  URL: ${frame.url}`);
    console.log(`  Origin: ${frame.securityOrigin}`);
    console.log(`  MIME: ${frame.mimeType}`);
    console.log(`  Frame ID: ${frame.id}`);

    // タイトルも取得
    const titleResult = (await client.send("Runtime.evaluate", {
      expression: "document.title",
      returnByValue: true,
    })) as { result: { value: string } };

    console.log(`  タイトル: ${titleResult.result.value}`);
  } catch (error) {
    console.error("\n エラー:", (error as Error).message);
  }
}

/**
 * [5] JavaScriptを実行
 *
 * Runtime.evaluate で任意のJSを実行
 */
async function executeJs(): Promise<void> {
  printSection("JavaScript実行");

  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  console.log("\n 例: document.title");
  console.log("     location.href");
  console.log("     document.querySelectorAll('a').length");

  const expression = await prompt("\n> JS式を入力: ");

  if (!expression) return;

  try {
    const result = (await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })) as {
      result: { value?: unknown; description?: string; type: string };
      exceptionDetails?: { text: string };
    };

    if (result.exceptionDetails) {
      console.log(`\n エラー: ${result.exceptionDetails.text}`);
    } else {
      console.log(`\n 結果 (${result.result.type}):`);
      if (result.result.value !== undefined) {
        console.log(`  ${JSON.stringify(result.result.value, null, 2)}`);
      } else {
        console.log(`  ${result.result.description}`);
      }
    }
  } catch (error) {
    console.error("\n エラー:", (error as Error).message);
  }
}

/**
 * [6] ページをナビゲート
 *
 * Page.navigate でURLに移動
 */
async function navigateTo(): Promise<void> {
  printSection("ページナビゲート");

  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  const url = await prompt("\n> URL (例: https://example.com): ");

  if (!url) return;

  try {
    console.log(`\n ナビゲート中...`);

    await client.send("Page.navigate", { url });

    // ロード完了を待つ
    await client.send("Page.stopLoading");
    await new Promise((r) => setTimeout(r, 1000));

    console.log(` 完了: ${url}`);
  } catch (error) {
    console.error("\n エラー:", (error as Error).message);
  }
}

/**
 * [7] スクリーンショットを撮影
 *
 * Page.captureScreenshot でスクショを撮る
 */
async function takeScreenshot(): Promise<void> {
  printSection("スクリーンショット撮影");

  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  const filename = await prompt(
    "\n> ファイル名 (デフォルト: screenshot.png): "
  );

  try {
    console.log(`\n 撮影中...`);

    const result = (await client.send("Page.captureScreenshot", {
      format: "png",
    })) as { data: string };

    const outputPath = filename || "screenshot.png";
    const buffer = Buffer.from(result.data, "base64");

    await Bun.write(outputPath, buffer);

    console.log(` 保存完了: ${outputPath} (${buffer.length} bytes)`);
  } catch (error) {
    console.error("\n エラー:", (error as Error).message);
  }
}

/**
 * [8] コンソール監視のトグル
 *
 * Runtime.consoleAPICalled イベントを監視
 */
async function toggleConsoleMonitor(): Promise<void> {
  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  if (consoleMonitoring) {
    client.off("Runtime.consoleAPICalled");
    consoleMonitoring = false;
    console.log("\n コンソール監視を停止しました。");
  } else {
    client.on("Runtime.consoleAPICalled", (params: unknown) => {
      const p = params as { type: string; args: Array<{ value?: unknown }> };
      const args = p.args.map((a) => a.value ?? "[object]").join(" ");
      console.log(`\n [console.${p.type}] ${args}`);
      process.stdout.write("\n> 選択: ");
    });
    consoleMonitoring = true;
    console.log("\n コンソール監視を開始しました。");
    console.log(" ブラウザでconsole.log()を実行すると表示されます。");
  }
}

/**
 * [9] ネットワーク監視のトグル
 *
 * Network.requestWillBeSent / responseReceived イベントを監視
 */
async function toggleNetworkMonitor(): Promise<void> {
  if (!client?.isConnected()) {
    console.log("\n 先にターゲットに接続してください。");
    return;
  }

  if (networkMonitoring) {
    client.off("Network.requestWillBeSent");
    client.off("Network.responseReceived");
    networkMonitoring = false;
    console.log("\n ネットワーク監視を停止しました。");
  } else {
    client.on("Network.requestWillBeSent", (params: unknown) => {
      const p = params as { request: { method: string; url: string } };
      const url = new URL(p.request.url);
      console.log(
        `\n [REQ] ${p.request.method} ${url.pathname.slice(0, 50)}`
      );
      process.stdout.write("\n> 選択: ");
    });

    client.on("Network.responseReceived", (params: unknown) => {
      const p = params as { response: { status: number; url: string } };
      const url = new URL(p.response.url);
      console.log(
        `\n [RES] ${p.response.status} ${url.pathname.slice(0, 50)}`
      );
      process.stdout.write("\n> 選択: ");
    });

    networkMonitoring = true;
    console.log("\n ネットワーク監視を開始しました。");
    console.log(" ブラウザでリクエストが発生すると表示されます。");
  }
}

// =============================================================================
// メイン
// =============================================================================

async function main() {
  console.clear();
  console.log("═".repeat(60));
  console.log(" Chrome DevTools Protocol (CDP) CLI");
  console.log("═".repeat(60));
  console.log("\n Chromeが --remote-debugging-port=9222 で起動している");
  console.log(" 必要があります。");
  console.log("\n 起動コマンド: bun run chrome");

  await showMainMenu();
}

main().catch(console.error);
