/**
 * Page ドメインラッパー (Core Web Vitals)
 *
 * 【学習ポイント】
 * Core Web Vitals は Google が定義したユーザー体験の指標:
 *
 * 1. LCP (Largest Contentful Paint) - 読み込みパフォーマンス
 *    - 最大のコンテンツ要素が表示されるまでの時間
 *    - 良好: 2.5秒以内
 *    - 改善が必要: 4秒以内
 *    - 悪い: 4秒超
 *
 * 2. FID (First Input Delay) - インタラクティブ性
 *    - ユーザーの最初の操作から応答までの遅延
 *    - 良好: 100ms以内
 *    - 改善が必要: 300ms以内
 *    - 悪い: 300ms超
 *    ※ CDPでは直接測定できないため、Long Tasks で代替
 *
 * 3. CLS (Cumulative Layout Shift) - 視覚的安定性
 *    - 予期しないレイアウトシフトの累積スコア
 *    - 良好: 0.1以内
 *    - 改善が必要: 0.25以内
 *    - 悪い: 0.25超
 *
 * その他の重要な指標:
 * - FCP (First Contentful Paint): 最初のコンテンツ描画
 * - TTFB (Time to First Byte): サーバー応答時間
 * - TTI (Time to Interactive): インタラクティブになるまでの時間
 */

import { EventEmitter } from 'events';
import { CDPClient } from '../client';
import type { WebVitals, PageLifecycleEvent } from '../../types';

export interface LifecycleTimings {
  navigationStart?: number;
  domContentLoaded?: number;
  load?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export class PageDomain extends EventEmitter {
  private client: CDPClient;
  private enabled = false;
  private lifecycleEvents: PageLifecycleEvent[] = [];
  private timings: LifecycleTimings = {};

  constructor(client: CDPClient) {
    super();
    this.client = client;
  }

  /**
   * Page ドメインを有効化
   */
  async enable(): Promise<void> {
    if (!this.enabled) {
      await this.client.Page.enable();
      await this.client.Runtime.enable();
      this.setupEventListeners();
      this.enabled = true;
    }
  }

  /**
   * Page ドメインを無効化
   */
  async disable(): Promise<void> {
    if (this.enabled) {
      await this.client.Page.disable();
      this.enabled = false;
    }
  }

  /**
   * イベントリスナーを設定
   *
   * 【学習ポイント】
   * ライフサイクルイベントの順序:
   * 1. navigationStart - ナビゲーション開始
   * 2. firstPaint - 最初の描画
   * 3. firstContentfulPaint - 最初のコンテンツ描画 (FCP)
   * 4. DOMContentLoaded - DOM構築完了
   * 5. load - 全リソースロード完了
   * 6. largestContentfulPaint - 最大コンテンツ描画 (LCP)
   */
  private setupEventListeners(): void {
    // ライフサイクルイベント
    this.client.on('Page.lifecycleEvent', (params: {
      name: string;
      timestamp: number;
    }) => {
      const event: PageLifecycleEvent = {
        name: params.name,
        timestamp: params.timestamp * 1000, // 秒をミリ秒に変換
      };
      this.lifecycleEvents.push(event);
      this.updateTimings(event);
      this.emit('lifecycleEvent', event);
    });

    // DOMContentLoaded
    this.client.on('Page.domContentEventFired', (params: { timestamp: number }) => {
      this.timings.domContentLoaded = params.timestamp * 1000;
      this.emit('domContentLoaded', params.timestamp * 1000);
    });

    // Load
    this.client.on('Page.loadEventFired', (params: { timestamp: number }) => {
      this.timings.load = params.timestamp * 1000;
      this.emit('load', params.timestamp * 1000);
    });

    // フレーム開始（ナビゲーション開始）
    this.client.on('Page.frameStartedLoading', () => {
      this.timings.navigationStart = Date.now();
      this.lifecycleEvents = [];
      this.emit('navigationStart');
    });
  }

  /**
   * タイミング情報を更新
   */
  private updateTimings(event: PageLifecycleEvent): void {
    switch (event.name) {
      case 'firstPaint':
        this.timings.firstPaint = event.timestamp;
        break;
      case 'firstContentfulPaint':
        this.timings.firstContentfulPaint = event.timestamp;
        break;
      case 'largestContentfulPaint':
        this.timings.largestContentfulPaint = event.timestamp;
        break;
    }
  }

  /**
   * Web Vitals を取得
   *
   * 【学習ポイント】
   * CDP から直接取得できる指標と、JavaScript で取得が必要な指標:
   *
   * CDP で取得可能:
   * - FCP: firstContentfulPaint イベント
   * - LCP: largestContentfulPaint イベント
   *
   * JavaScript (Performance API) で取得:
   * - TTFB: performance.timing.responseStart - navigationStart
   * - FID: PerformanceObserver で first-input を監視
   * - CLS: PerformanceObserver で layout-shift を監視
   */
  async getWebVitals(): Promise<WebVitals> {
    const navStart = this.timings.navigationStart ?? 0;

    // Performance API から追加の指標を取得
    let ttfb: number | undefined;
    try {
      const result = await this.client.Runtime.evaluate(`
        (function() {
          const timing = performance.timing;
          return {
            ttfb: timing.responseStart - timing.navigationStart
          };
        })()
      `);
      if (result.result?.value) {
        ttfb = result.result.value.ttfb;
      }
    } catch {
      // ignore
    }

    return {
      timestamp: Date.now(),
      fcp: this.timings.firstContentfulPaint
        ? this.timings.firstContentfulPaint - navStart
        : undefined,
      lcp: this.timings.largestContentfulPaint
        ? this.timings.largestContentfulPaint - navStart
        : undefined,
      ttfb,
      // FID と CLS は JavaScript 側で測定が必要
      fid: undefined,
      cls: undefined,
    };
  }

  /**
   * 現在のタイミング情報を取得
   */
  getTimings(): LifecycleTimings {
    return { ...this.timings };
  }

  /**
   * ライフサイクルイベントの履歴を取得
   */
  getLifecycleEvents(): PageLifecycleEvent[] {
    return [...this.lifecycleEvents];
  }

  /**
   * ページをリロード
   */
  async reload(ignoreCache = false): Promise<void> {
    this.timings = {};
    this.lifecycleEvents = [];
    await this.client.Page.reload({ ignoreCache });
  }

  /**
   * 指定URLに移動
   */
  async navigate(url: string): Promise<void> {
    this.timings = {};
    this.lifecycleEvents = [];
    await this.client.Page.navigate(url);
  }

  /**
   * タイミング情報をリセット
   */
  reset(): void {
    this.timings = {};
    this.lifecycleEvents = [];
  }
}
