/**
 * HeapProfiler ドメインラッパー (メモリ分析)
 *
 * 【学習ポイント】
 * JavaScript のメモリ管理とガベージコレクション:
 *
 * 1. ヒープ構造
 *    - 新世代 (New Space): 新しいオブジェクトが割り当てられる
 *    - 旧世代 (Old Space): 長寿命のオブジェクトが移動される
 *
 * 2. メモリリークのパターン
 *    - グローバル変数への参照保持
 *    - クロージャによる意図しない参照
 *    - イベントリスナーの解除忘れ
 *    - タイマー/インターバルのクリア忘れ
 *    - DOM参照の保持
 *
 * 3. スナップショット分析
 *    - Shallow Size: オブジェクト自体のサイズ
 *    - Retained Size: オブジェクト + 到達可能なオブジェクトの合計
 *
 * メモリリーク検出手順:
 * 1. 初期スナップショット取得
 * 2. 疑わしい操作を実行
 * 3. GCを実行
 * 4. 2回目のスナップショット取得
 * 5. 2つのスナップショットを比較
 */

import { EventEmitter } from 'events';
import { CDPClient } from '../client';

export interface HeapSnapshotProgress {
  done: number;
  total: number;
  finished: boolean;
}

export interface HeapStats {
  timestamp: number;
  usedSize: number;
  totalSize: number;
}

export class HeapProfilerDomain extends EventEmitter {
  private client: CDPClient;
  private enabled = false;
  private snapshotChunks: string[] = [];
  private isCollectingSnapshot = false;

  constructor(client: CDPClient) {
    super();
    this.client = client;
  }

  /**
   * HeapProfiler ドメインを有効化
   */
  async enable(): Promise<void> {
    if (!this.enabled) {
      await this.client.HeapProfiler.enable();
      this.setupEventListeners();
      this.enabled = true;
    }
  }

  /**
   * HeapProfiler ドメインを無効化
   */
  async disable(): Promise<void> {
    if (this.enabled) {
      await this.client.HeapProfiler.disable();
      this.enabled = false;
    }
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // スナップショットのチャンク受信
    this.client.on('HeapProfiler.addHeapSnapshotChunk', (params: { chunk: string }) => {
      this.snapshotChunks.push(params.chunk);
      this.emit('snapshotChunk', params.chunk);
    });

    // 進捗報告
    this.client.on('HeapProfiler.reportHeapSnapshotProgress', (params: { done: number; total: number; finished?: boolean }) => {
      const progress: HeapSnapshotProgress = {
        done: params.done,
        total: params.total,
        finished: params.finished ?? false,
      };
      this.emit('snapshotProgress', progress);

      if (progress.finished) {
        this.isCollectingSnapshot = false;
        const snapshot = this.snapshotChunks.join('');
        this.snapshotChunks = [];
        this.emit('snapshotComplete', snapshot);
      }
    });
  }

  /**
   * ヒープスナップショットを取得
   *
   * 【学習ポイント】
   * スナップショットは大きなデータになるため、
   * チャンクごとにイベントで送信されます。
   *
   * スナップショットの内容:
   * - オブジェクトのグラフ構造
   * - 各オブジェクトのサイズ
   * - 参照関係
   */
  async takeSnapshot(): Promise<string> {
    if (this.isCollectingSnapshot) {
      throw new Error('Snapshot already in progress');
    }

    this.isCollectingSnapshot = true;
    this.snapshotChunks = [];

    return new Promise((resolve, reject) => {
      const onComplete = (snapshot: string) => {
        this.removeListener('snapshotComplete', onComplete);
        resolve(snapshot);
      };

      this.on('snapshotComplete', onComplete);

      this.client.HeapProfiler.takeHeapSnapshot({ reportProgress: true })
        .catch((error) => {
          this.isCollectingSnapshot = false;
          this.removeListener('snapshotComplete', onComplete);
          reject(error);
        });
    });
  }

  /**
   * ガベージコレクションを強制実行
   *
   * 【学習ポイント】
   * メモリリーク検出時は、スナップショット前にGCを実行して
   * 本当にリークしているオブジェクトだけを特定します。
   */
  async collectGarbage(): Promise<void> {
    await this.client.HeapProfiler.collectGarbage();
  }

  /**
   * ヒープオブジェクトの追跡を開始
   *
   * 【学習ポイント】
   * アロケーション追跡により、メモリが増加している
   * 具体的な場所を特定できます。
   */
  async startTrackingAllocations(): Promise<void> {
    await this.client.HeapProfiler.startTrackingHeapObjects({
      trackAllocations: true,
    });
  }

  /**
   * ヒープオブジェクトの追跡を停止
   */
  async stopTrackingAllocations(): Promise<void> {
    await this.client.HeapProfiler.stopTrackingHeapObjects();
  }

  /**
   * 現在のヒープ使用量を取得
   */
  async getHeapStats(): Promise<HeapStats> {
    const { usedSize, totalSize } = await this.client.Runtime.getHeapUsage();
    return {
      timestamp: Date.now(),
      usedSize,
      totalSize,
    };
  }

  get isSnapshotInProgress(): boolean {
    return this.isCollectingSnapshot;
  }
}
