/**
 * Performance ドメインラッパー
 *
 * 【学習ポイント】
 * Performance ドメインは、ブラウザのパフォーマンスメトリクスを
 * プログラマティックに取得するためのAPIです。
 *
 * 取得できる主なメトリクス:
 * - TaskDuration: スクリプトタスクの実行時間
 * - ScriptDuration: JavaScript の実行時間
 * - LayoutDuration: レイアウト計算時間
 * - RecalcStyleDuration: スタイル再計算時間
 * - JSHeapUsedSize: 使用中の JS ヒープサイズ
 * - JSHeapTotalSize: 合計 JS ヒープサイズ
 * - Documents: アクティブなドキュメント数
 * - Frames: フレーム数
 * - JSEventListeners: JavaScript イベントリスナー数
 * - Nodes: DOM ノード数
 * - LayoutCount: レイアウト実行回数
 */

import { CDPClient } from '../client';
import type { PerformanceMetric } from '../../types';

export interface PerformanceMetricsResult {
  timestamp: number;
  taskDuration: number;
  scriptDuration: number;
  layoutDuration: number;
  recalcStyleDuration: number;
  jsHeapUsedSize: number;
  jsHeapTotalSize: number;
  documents: number;
  frames: number;
  jsEventListeners: number;
  nodes: number;
  layoutCount: number;
}

export class PerformanceDomain {
  private client: CDPClient;
  private enabled = false;

  constructor(client: CDPClient) {
    this.client = client;
  }

  /**
   * Performance ドメインを有効化
   */
  async enable(): Promise<void> {
    if (!this.enabled) {
      await this.client.Performance.enable();
      this.enabled = true;
    }
  }

  /**
   * Performance ドメインを無効化
   */
  async disable(): Promise<void> {
    if (this.enabled) {
      await this.client.Performance.disable();
      this.enabled = false;
    }
  }

  /**
   * 現在のパフォーマンスメトリクスを取得
   *
   * 【学習ポイント】
   * getMetrics() は現在の累積値を返します。
   * 変化を追跡するには、定期的に取得して差分を計算します。
   */
  async getMetrics(): Promise<PerformanceMetricsResult> {
    const { metrics } = await this.client.Performance.getMetrics();

    const findMetric = (name: string): number => {
      const metric = metrics.find((m: PerformanceMetric) => m.name === name);
      return metric?.value ?? 0;
    };

    return {
      timestamp: Date.now(),
      taskDuration: findMetric('TaskDuration'),
      scriptDuration: findMetric('ScriptDuration'),
      layoutDuration: findMetric('LayoutDuration'),
      recalcStyleDuration: findMetric('RecalcStyleDuration'),
      jsHeapUsedSize: findMetric('JSHeapUsedSize'),
      jsHeapTotalSize: findMetric('JSHeapTotalSize'),
      documents: findMetric('Documents'),
      frames: findMetric('Frames'),
      jsEventListeners: findMetric('JSEventListeners'),
      nodes: findMetric('Nodes'),
      layoutCount: findMetric('LayoutCount'),
    };
  }

  /**
   * メトリクスを人間が読みやすい形式に変換
   */
  formatMetrics(metrics: PerformanceMetricsResult): Record<string, string> {
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatDuration = (seconds: number): string => {
      if (seconds < 0.001) return `${(seconds * 1000000).toFixed(2)} μs`;
      if (seconds < 1) return `${(seconds * 1000).toFixed(2)} ms`;
      return `${seconds.toFixed(2)} s`;
    };

    return {
      'タスク実行時間': formatDuration(metrics.taskDuration),
      'スクリプト実行時間': formatDuration(metrics.scriptDuration),
      'レイアウト時間': formatDuration(metrics.layoutDuration),
      'スタイル再計算時間': formatDuration(metrics.recalcStyleDuration),
      'JSヒープ使用量': formatBytes(metrics.jsHeapUsedSize),
      'JSヒープ合計': formatBytes(metrics.jsHeapTotalSize),
      'ヒープ使用率': `${((metrics.jsHeapUsedSize / metrics.jsHeapTotalSize) * 100).toFixed(1)}%`,
      'ドキュメント数': metrics.documents.toString(),
      'フレーム数': metrics.frames.toString(),
      'イベントリスナー数': metrics.jsEventListeners.toString(),
      'DOMノード数': metrics.nodes.toString(),
      'レイアウト回数': metrics.layoutCount.toString(),
    };
  }
}
