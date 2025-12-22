/**
 * Profiler ドメインラッパー (CPU プロファイリング)
 *
 * 【学習ポイント】
 * CPU プロファイリングは JavaScript の実行時間を分析し、
 * パフォーマンスボトルネックを特定するための手法です。
 *
 * プロファイリングの仕組み:
 * 1. start() を呼び出してサンプリングを開始
 * 2. 一定間隔（デフォルト1000μs）でコールスタックをサンプリング
 * 3. stop() を呼び出してプロファイル結果を取得
 *
 * プロファイル結果の構造:
 * - nodes: コールスタックのノード（各関数の情報）
 * - samples: サンプリングされたノードID配列
 * - timeDeltas: 各サンプル間の時間差（μs）
 *
 * フレームグラフの作成:
 * nodes を使ってコールツリーを構築し、
 * 各ノードの hitCount や時間占有率を可視化します。
 */

import { CDPClient } from '../client';
import type { CPUProfile, CPUProfileNode } from '../../types';

export interface FlattenedProfileNode {
  id: number;
  functionName: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
  selfTime: number;  // このノード自身の実行時間
  totalTime: number; // 子ノードを含む合計実行時間
  hitCount: number;
  depth: number;
  parent?: number;
  children: number[];
}

export interface ProfileSummary {
  totalTime: number;
  sampleCount: number;
  topFunctions: Array<{
    name: string;
    url: string;
    selfTime: number;
    percentage: number;
  }>;
}

export class ProfilerDomain {
  private client: CDPClient;
  private enabled = false;
  private isRecording = false;
  private samplingInterval = 100; // マイクロ秒

  constructor(client: CDPClient) {
    this.client = client;
  }

  /**
   * Profiler ドメインを有効化
   */
  async enable(): Promise<void> {
    if (!this.enabled) {
      await this.client.Profiler.enable();
      await this.client.Profiler.setSamplingInterval(this.samplingInterval);
      this.enabled = true;
    }
  }

  /**
   * Profiler ドメインを無効化
   */
  async disable(): Promise<void> {
    if (this.enabled) {
      if (this.isRecording) {
        await this.stop();
      }
      await this.client.Profiler.disable();
      this.enabled = false;
    }
  }

  /**
   * サンプリング間隔を設定
   *
   * 【学習ポイント】
   * 間隔が短いほど精度が上がりますが、オーバーヘッドも増加します。
   * - 100μs: 高精度（開発環境向け）
   * - 1000μs: 標準（本番環境向け）
   */
  async setSamplingInterval(intervalMicros: number): Promise<void> {
    this.samplingInterval = intervalMicros;
    if (this.enabled) {
      await this.client.Profiler.setSamplingInterval(intervalMicros);
    }
  }

  /**
   * プロファイリング開始
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      await this.enable();
    }
    if (!this.isRecording) {
      await this.client.Profiler.start();
      this.isRecording = true;
    }
  }

  /**
   * プロファイリング停止してプロファイルを取得
   */
  async stop(): Promise<CPUProfile> {
    if (!this.isRecording) {
      throw new Error('Profiling not started');
    }
    const { profile } = await this.client.Profiler.stop();
    this.isRecording = false;
    return profile;
  }

  get recording(): boolean {
    return this.isRecording;
  }

  /**
   * プロファイル結果からサマリーを生成
   *
   * 【学習ポイント】
   * プロファイル分析のポイント:
   * 1. selfTime が大きい関数 → 最適化の優先候補
   * 2. totalTime が大きい関数 → ボトルネックの可能性
   * 3. hitCount が多い関数 → 頻繁に呼ばれている
   */
  analyzePprofile(profile: CPUProfile): ProfileSummary {
    const totalTime = profile.endTime - profile.startTime;
    const sampleCount = profile.samples?.length ?? 0;

    // 各ノードの self time を計算
    const selfTimes = new Map<number, number>();
    const samples = profile.samples ?? [];
    const timeDeltas = profile.timeDeltas ?? [];

    for (let i = 0; i < samples.length; i++) {
      const nodeId = samples[i];
      const delta = timeDeltas[i] ?? 0;
      selfTimes.set(nodeId, (selfTimes.get(nodeId) ?? 0) + delta);
    }

    // ノードを selfTime でソート
    const nodeStats = profile.nodes
      .map((node) => ({
        name: node.callFrame.functionName || '(anonymous)',
        url: node.callFrame.url,
        selfTime: selfTimes.get(node.id) ?? 0,
      }))
      .filter((n) => n.selfTime > 0)
      .sort((a, b) => b.selfTime - a.selfTime);

    // 上位10関数
    const topFunctions = nodeStats.slice(0, 10).map((n) => ({
      name: n.name,
      url: n.url,
      selfTime: n.selfTime,
      percentage: totalTime > 0 ? (n.selfTime / totalTime) * 100 : 0,
    }));

    return {
      totalTime,
      sampleCount,
      topFunctions,
    };
  }

  /**
   * プロファイルをフラット化（フレームグラフ用）
   */
  flattenProfile(profile: CPUProfile): FlattenedProfileNode[] {
    const samples = profile.samples ?? [];
    const timeDeltas = profile.timeDeltas ?? [];
    const nodeMap = new Map<number, CPUProfileNode>();
    const selfTimes = new Map<number, number>();

    // ノードマップを作成
    for (const node of profile.nodes) {
      nodeMap.set(node.id, node);
    }

    // self time を計算
    for (let i = 0; i < samples.length; i++) {
      const nodeId = samples[i];
      const delta = timeDeltas[i] ?? 0;
      selfTimes.set(nodeId, (selfTimes.get(nodeId) ?? 0) + delta);
    }

    // フラット化
    const result: FlattenedProfileNode[] = [];
    const visited = new Set<number>();

    const flatten = (nodeId: number, depth: number, parentId?: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return;

      const selfTime = selfTimes.get(nodeId) ?? 0;
      let totalTime = selfTime;

      // 子ノードの時間を加算
      const children = node.children ?? [];
      for (const childId of children) {
        flatten(childId, depth + 1, nodeId);
        const childNode = result.find((n) => n.id === childId);
        if (childNode) {
          totalTime += childNode.totalTime;
        }
      }

      result.push({
        id: node.id,
        functionName: node.callFrame.functionName || '(anonymous)',
        url: node.callFrame.url,
        lineNumber: node.callFrame.lineNumber,
        columnNumber: node.callFrame.columnNumber,
        selfTime,
        totalTime,
        hitCount: node.hitCount ?? 0,
        depth,
        parent: parentId,
        children,
      });
    };

    // ルートノード（通常 id=1）から開始
    const rootNode = profile.nodes.find((n) => !n.callFrame.url && n.callFrame.functionName === '(root)');
    if (rootNode) {
      flatten(rootNode.id, 0);
    }

    return result;
  }
}
