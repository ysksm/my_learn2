/**
 * 統合メトリクスコレクター
 *
 * 【学習ポイント】
 * このコレクターは CDP の各ドメインからメトリクスを収集し、
 * 統一されたインターフェースで提供します。
 *
 * 収集フロー:
 * 1. 定期的なポーリング（configurable interval）
 * 2. 各ドメインからメトリクスを取得
 * 3. WebSocket 経由でフロントエンドに配信
 */

import { EventEmitter } from 'events';
import { CDPClient } from '../cdp/client';
import {
  PerformanceDomain,
  ProfilerDomain,
  HeapProfilerDomain,
  NetworkDomain,
  PageDomain,
} from '../cdp/domains';
import type {
  CPUMetrics,
  MemoryMetrics,
  NetworkMetrics,
  WebVitals,
  AllMetrics,
  CPUProfile,
} from '../types';

export interface MetricsCollectorConfig {
  pollInterval: number; // ミリ秒
}

export class MetricsCollector extends EventEmitter {
  private client: CDPClient;
  private config: MetricsCollectorConfig;

  // ドメインインスタンス
  private performanceDomain: PerformanceDomain;
  private profilerDomain: ProfilerDomain;
  private heapProfilerDomain: HeapProfilerDomain;
  private networkDomain: NetworkDomain;
  private pageDomain: PageDomain;

  // 状態
  private pollTimer: NodeJS.Timeout | null = null;
  private isCollecting = false;
  private lastMetrics: AllMetrics | null = null;

  constructor(client: CDPClient, config: Partial<MetricsCollectorConfig> = {}) {
    super();
    this.client = client;
    this.config = {
      pollInterval: config.pollInterval ?? 1000,
    };

    // ドメインを初期化
    this.performanceDomain = new PerformanceDomain(client);
    this.profilerDomain = new ProfilerDomain(client);
    this.heapProfilerDomain = new HeapProfilerDomain(client);
    this.networkDomain = new NetworkDomain(client);
    this.pageDomain = new PageDomain(client);

    this.setupEventForwarding();
  }

  /**
   * ドメインのイベントを転送
   */
  private setupEventForwarding(): void {
    // ネットワークイベント
    this.networkDomain.on('requestStart', (req) => {
      this.emit('networkRequest', req);
    });
    this.networkDomain.on('requestComplete', (req) => {
      this.emit('networkRequestComplete', req);
    });
    this.networkDomain.on('requestFailed', (req) => {
      this.emit('networkRequestFailed', req);
    });

    // ページイベント
    this.pageDomain.on('lifecycleEvent', (event) => {
      this.emit('lifecycleEvent', event);
    });

    // ヒープスナップショット
    this.heapProfilerDomain.on('snapshotProgress', (progress) => {
      this.emit('heapSnapshotProgress', progress);
    });
    this.heapProfilerDomain.on('snapshotComplete', (snapshot) => {
      this.emit('heapSnapshotComplete', snapshot);
    });
  }

  /**
   * 全ドメインを有効化
   */
  async enable(): Promise<void> {
    await Promise.all([
      this.performanceDomain.enable(),
      this.profilerDomain.enable(),
      this.heapProfilerDomain.enable(),
      this.networkDomain.enable(),
      this.pageDomain.enable(),
    ]);
  }

  /**
   * 全ドメインを無効化
   */
  async disable(): Promise<void> {
    this.stopCollection();
    await Promise.all([
      this.performanceDomain.disable(),
      this.profilerDomain.disable(),
      this.heapProfilerDomain.disable(),
      this.networkDomain.disable(),
      this.pageDomain.disable(),
    ]);
  }

  /**
   * メトリクス収集を開始
   */
  startCollection(interval?: number): void {
    if (this.isCollecting) return;

    const pollInterval = interval ?? this.config.pollInterval;
    this.isCollecting = true;

    const poll = async () => {
      try {
        const metrics = await this.collectAll();
        this.lastMetrics = metrics;
        this.emit('metrics', metrics);
      } catch (error) {
        this.emit('error', error);
      }

      if (this.isCollecting) {
        this.pollTimer = setTimeout(poll, pollInterval);
      }
    };

    poll();
  }

  /**
   * メトリクス収集を停止
   */
  stopCollection(): void {
    this.isCollecting = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * 全メトリクスを収集
   */
  async collectAll(): Promise<AllMetrics> {
    const [perfMetrics, heapStats, networkSummary, vitals] = await Promise.all([
      this.performanceDomain.getMetrics(),
      this.heapProfilerDomain.getHeapStats(),
      Promise.resolve(this.networkDomain.getSummary()),
      this.pageDomain.getWebVitals(),
    ]);

    const cpu: CPUMetrics = {
      timestamp: Date.now(),
      isRecording: this.profilerDomain.recording,
      scriptDuration: perfMetrics.scriptDuration,
      taskDuration: perfMetrics.taskDuration,
      jsHeapUsedSize: perfMetrics.jsHeapUsedSize,
    };

    const memory: MemoryMetrics = {
      timestamp: Date.now(),
      jsHeapUsedSize: heapStats.usedSize,
      jsHeapTotalSize: heapStats.totalSize,
      documentsCount: perfMetrics.documents,
      nodesCount: perfMetrics.nodes,
      listenersCount: perfMetrics.jsEventListeners,
    };

    const network: NetworkMetrics = {
      timestamp: Date.now(),
      requests: this.networkDomain.getRequests(),
      totalRequests: networkSummary.totalRequests,
      failedRequests: networkSummary.failedRequests,
      totalTransferSize: networkSummary.totalTransferSize,
    };

    return {
      cpu,
      memory,
      network,
      vitals,
    };
  }

  /**
   * 最後に収集したメトリクスを取得
   */
  getLastMetrics(): AllMetrics | null {
    return this.lastMetrics;
  }

  // ============================================================
  // CPU プロファイリング
  // ============================================================

  /**
   * CPU プロファイリングを開始
   */
  async startCpuProfiling(): Promise<void> {
    await this.profilerDomain.start();
    this.emit('cpuProfilingStarted');
  }

  /**
   * CPU プロファイリングを停止
   */
  async stopCpuProfiling(): Promise<CPUProfile> {
    const profile = await this.profilerDomain.stop();
    const summary = this.profilerDomain.analyzePprofile(profile);
    this.emit('cpuProfilingStopped', { profile, summary });
    return profile;
  }

  get isCpuProfiling(): boolean {
    return this.profilerDomain.recording;
  }

  // ============================================================
  // メモリ分析
  // ============================================================

  /**
   * ヒープスナップショットを取得
   */
  async takeHeapSnapshot(): Promise<string> {
    return this.heapProfilerDomain.takeSnapshot();
  }

  /**
   * ガベージコレクションを強制実行
   */
  async collectGarbage(): Promise<void> {
    await this.heapProfilerDomain.collectGarbage();
  }

  // ============================================================
  // ネットワーク
  // ============================================================

  /**
   * ネットワーク記録をクリア
   */
  clearNetworkRequests(): void {
    this.networkDomain.clearRequests();
  }

  /**
   * キャッシュを無効化
   */
  async setCacheDisabled(disabled: boolean): Promise<void> {
    await this.networkDomain.setCacheDisabled(disabled);
  }

  // ============================================================
  // ページ操作
  // ============================================================

  /**
   * ページをリロード
   */
  async reloadPage(ignoreCache = false): Promise<void> {
    this.clearNetworkRequests();
    await this.pageDomain.reload(ignoreCache);
  }

  /**
   * 指定URLに移動
   */
  async navigateTo(url: string): Promise<void> {
    this.clearNetworkRequests();
    await this.pageDomain.navigate(url);
  }

  // ============================================================
  // ゲッター
  // ============================================================

  get performanceMetrics() {
    return this.performanceDomain;
  }

  get profiler() {
    return this.profilerDomain;
  }

  get heapProfiler() {
    return this.heapProfilerDomain;
  }

  get network() {
    return this.networkDomain;
  }

  get page() {
    return this.pageDomain;
  }
}
