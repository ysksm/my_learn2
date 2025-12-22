/**
 * Chrome DevTools Protocol クライアント
 *
 * 【学習ポイント】
 * CDP (Chrome DevTools Protocol) は Chrome ブラウザを制御するための
 * WebSocket ベースのプロトコルです。
 *
 * 主要な概念:
 * - ドメイン: 機能ごとにグループ化されたAPI (Performance, Profiler, Network等)
 * - メソッド: ドメイン内の実行可能な操作 (例: Performance.getMetrics)
 * - イベント: ブラウザから送信される通知 (例: Network.requestWillBeSent)
 *
 * 使用例:
 * ```
 * const client = new CDPClient({ host: 'localhost', port: 9222 });
 * await client.connect();
 * const metrics = await client.send('Performance.getMetrics');
 * ```
 */

import CDP from 'chrome-remote-interface';
import { EventEmitter } from 'events';
import type {
  PerformanceMetric,
  CPUProfile,
  ConnectionStatus,
} from '../types';

export interface CDPClientConfig {
  host: string;
  port: number;
}

export class CDPClient extends EventEmitter {
  private client: CDP.Client | null = null;
  private config: CDPClientConfig;
  private _connectionStatus: ConnectionStatus = { connected: false };

  constructor(config: CDPClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Chrome DevTools に接続
   *
   * 【学習ポイント】
   * Chrome を `--remote-debugging-port=9222` で起動すると
   * WebSocket エンドポイントが公開され、CDP での制御が可能になります。
   */
  async connect(): Promise<void> {
    try {
      // 利用可能なターゲット（タブ）を取得
      const targets = await CDP.List({
        host: this.config.host,
        port: this.config.port,
      });

      // pageタイプのターゲットを優先
      const target = targets.find((t) => t.type === 'page') || targets[0];

      if (!target) {
        throw new Error('No available targets');
      }

      // ターゲットに接続
      this.client = await CDP({
        host: this.config.host,
        port: this.config.port,
        target: target.id,
      });

      // ブラウザ情報を取得
      const { Browser } = this.client;
      const browserVersion = await Browser.getVersion();

      this._connectionStatus = {
        connected: true,
        browserInfo: {
          browser: browserVersion.product,
          protocolVersion: browserVersion.protocolVersion,
          userAgent: browserVersion.userAgent,
        },
        targetInfo: {
          id: target.id,
          type: target.type,
          title: target.title,
          url: target.url,
        },
      };

      // 接続切断イベントのハンドリング
      this.client.on('disconnect', () => {
        this._connectionStatus = { connected: false };
        this.emit('disconnected');
      });

      this.emit('connected', this._connectionStatus);
    } catch (error) {
      this._connectionStatus = { connected: false };
      throw error;
    }
  }

  /**
   * 接続を切断
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this._connectionStatus = { connected: false };
    }
  }

  get isConnected(): boolean {
    return this.client !== null;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  /**
   * CDP メソッドを実行
   *
   * 【学習ポイント】
   * CDP のメソッドは `Domain.method` の形式で呼び出します。
   * 例: 'Performance.getMetrics', 'Profiler.start'
   */
  async send<T>(method: string, params?: object): Promise<T> {
    if (!this.client) {
      throw new Error('CDP client not connected');
    }
    return this.client.send(method, params) as Promise<T>;
  }

  /**
   * CDP イベントをリスン
   *
   * 【学習ポイント】
   * CDP イベントは `Domain.eventName` の形式です。
   * 例: 'Network.requestWillBeSent', 'Page.loadEventFired'
   */
  on(event: string, handler: (...args: unknown[]) => void): this {
    if (this.client) {
      this.client.on(event as Parameters<CDP.Client['on']>[0], handler);
    }
    return super.on(event, handler);
  }

  // ============================================================
  // Performance ドメイン
  // ============================================================

  /**
   * Performance ドメインを有効化
   *
   * 【学習ポイント】
   * Performance ドメインはブラウザのパフォーマンスメトリクスを取得します:
   * - TaskDuration: スクリプト実行時間
   * - JSHeapUsedSize: 使用中のJSヒープサイズ
   * - JSHeapTotalSize: 合計JSヒープサイズ
   * - Documents: ドキュメント数
   * - Nodes: DOMノード数
   * - LayoutCount: レイアウト計算回数
   */
  get Performance() {
    return {
      enable: () => this.send('Performance.enable'),
      disable: () => this.send('Performance.disable'),
      getMetrics: () =>
        this.send<{ metrics: PerformanceMetric[] }>('Performance.getMetrics'),
    };
  }

  // ============================================================
  // Profiler ドメイン (CPU プロファイリング)
  // ============================================================

  /**
   * Profiler ドメイン
   *
   * 【学習ポイント】
   * Profiler ドメインは JavaScript の CPU プロファイリングを行います:
   * - start/stop: プロファイリングの開始・停止
   * - setSamplingInterval: サンプリング間隔（マイクロ秒）の設定
   *
   * プロファイル結果には以下が含まれます:
   * - nodes: コールスタックのノード（関数情報）
   * - samples: サンプリングされたノードID
   * - timeDeltas: 各サンプル間の時間差
   */
  get Profiler() {
    return {
      enable: () => this.send('Profiler.enable'),
      disable: () => this.send('Profiler.disable'),
      start: () => this.send('Profiler.start'),
      stop: () => this.send<{ profile: CPUProfile }>('Profiler.stop'),
      setSamplingInterval: (interval: number) =>
        this.send('Profiler.setSamplingInterval', { interval }),
    };
  }

  // ============================================================
  // HeapProfiler ドメイン (メモリ分析)
  // ============================================================

  /**
   * HeapProfiler ドメイン
   *
   * 【学習ポイント】
   * HeapProfiler ドメインは JavaScript ヒープのメモリ分析を行います:
   * - takeHeapSnapshot: ヒープスナップショットを取得
   * - startTrackingHeapObjects: オブジェクトアロケーションの追跡開始
   *
   * メモリリーク検出の手順:
   * 1. スナップショット1を取得
   * 2. メモリリークが疑われる操作を実行
   * 3. スナップショット2を取得
   * 4. 2つのスナップショットを比較し、増加したオブジェクトを特定
   */
  get HeapProfiler() {
    return {
      enable: () => this.send('HeapProfiler.enable'),
      disable: () => this.send('HeapProfiler.disable'),
      takeHeapSnapshot: (options?: { reportProgress?: boolean }) =>
        this.send('HeapProfiler.takeHeapSnapshot', options),
      startTrackingHeapObjects: (options?: { trackAllocations?: boolean }) =>
        this.send('HeapProfiler.startTrackingHeapObjects', options),
      stopTrackingHeapObjects: () =>
        this.send('HeapProfiler.stopTrackingHeapObjects'),
      collectGarbage: () => this.send('HeapProfiler.collectGarbage'),
    };
  }

  // ============================================================
  // Network ドメイン
  // ============================================================

  /**
   * Network ドメイン
   *
   * 【学習ポイント】
   * Network ドメインはネットワークリクエストを監視します:
   *
   * 主要イベント:
   * - requestWillBeSent: リクエスト送信時
   * - responseReceived: レスポンス受信時
   * - loadingFinished: ロード完了時
   * - loadingFailed: ロード失敗時
   *
   * タイミング情報:
   * - DNS lookup time: dnsEnd - dnsStart
   * - Connection time: connectEnd - connectStart
   * - TTFB: receiveHeadersEnd - sendEnd
   */
  get Network() {
    return {
      enable: (options?: {
        maxTotalBufferSize?: number;
        maxResourceBufferSize?: number;
      }) => this.send('Network.enable', options),
      disable: () => this.send('Network.disable'),
      clearBrowserCache: () => this.send('Network.clearBrowserCache'),
      setCacheDisabled: (cacheDisabled: boolean) =>
        this.send('Network.setCacheDisabled', { cacheDisabled }),
    };
  }

  // ============================================================
  // DOM ドメイン
  // ============================================================

  /**
   * DOM ドメイン
   *
   * 【学習ポイント】
   * DOM ドメインは DOM ツリーの操作と検査を行います:
   * - getDocument: ルートドキュメントを取得
   * - querySelector: CSS セレクタで要素を検索
   *
   * パフォーマンスに影響する DOM 指標:
   * - ノード数: 多すぎると描画・JavaScript 処理が遅くなる
   * - ツリーの深さ: 深いとスタイル計算が遅くなる
   */
  get DOM() {
    return {
      enable: () => this.send('DOM.enable'),
      disable: () => this.send('DOM.disable'),
      getDocument: () =>
        this.send<{ root: { nodeId: number } }>('DOM.getDocument'),
    };
  }

  // ============================================================
  // Page ドメイン
  // ============================================================

  /**
   * Page ドメイン
   *
   * 【学習ポイント】
   * Page ドメインはページのライフサイクルイベントを提供します:
   *
   * 主要なライフサイクルイベント:
   * - DOMContentLoaded: DOM ツリーの構築完了
   * - load: 全リソースのロード完了
   * - firstPaint: 最初の描画
   * - firstContentfulPaint: 最初のコンテンツ描画 (FCP)
   * - largestContentfulPaint: 最大コンテンツ描画 (LCP)
   *
   * Core Web Vitals との関係:
   * - LCP: largestContentfulPaint イベント
   * - FID: 最初のユーザー入力からの遅延（別途計測が必要）
   * - CLS: レイアウトシフトの累積（LayoutInstability イベント）
   */
  get Page() {
    return {
      enable: () => this.send('Page.enable'),
      disable: () => this.send('Page.disable'),
      reload: (options?: { ignoreCache?: boolean }) =>
        this.send('Page.reload', options),
      navigate: (url: string) => this.send('Page.navigate', { url }),
      getResourceTree: () => this.send('Page.getResourceTree'),
    };
  }

  // ============================================================
  // Runtime ドメイン
  // ============================================================

  /**
   * Runtime ドメイン
   *
   * 【学習ポイント】
   * Runtime ドメインは JavaScript の実行環境を制御します:
   * - evaluate: JavaScript コードを実行
   * - getHeapUsage: ヒープ使用量を取得
   */
  get Runtime() {
    return {
      enable: () => this.send('Runtime.enable'),
      disable: () => this.send('Runtime.disable'),
      evaluate: (expression: string) =>
        this.send('Runtime.evaluate', { expression, returnByValue: true }),
      getHeapUsage: () =>
        this.send<{ usedSize: number; totalSize: number }>(
          'Runtime.getHeapUsage'
        ),
    };
  }
}
