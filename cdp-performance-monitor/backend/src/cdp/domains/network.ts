/**
 * Network ドメインラッパー
 *
 * 【学習ポイント】
 * ネットワークパフォーマンスの最適化ポイント:
 *
 * 1. タイミング分析
 *    - DNS Lookup: ドメイン名解決時間
 *    - Connection: TCP接続確立時間
 *    - SSL/TLS: セキュア接続のハンドシェイク時間
 *    - TTFB (Time to First Byte): 最初のバイト受信までの時間
 *    - Content Download: コンテンツダウンロード時間
 *
 * 2. 最適化の指標
 *    - リソース数: 少ないほど良い（バンドル化）
 *    - 転送サイズ: 圧縮・最小化
 *    - キャッシュ利用: 304レスポンスの活用
 *    - HTTP/2: 多重化による効率化
 *
 * 3. ウォーターフォール分析
 *    - クリティカルパス: レンダリングをブロックするリソース
 *    - 並列ダウンロード: 同時接続数の制限
 *    - リソースの優先順位
 */

import { EventEmitter } from 'events';
import { CDPClient } from '../client';
import type { NetworkRequest } from '../../types';

export interface NetworkTiming {
  dnsTime: number;
  connectTime: number;
  sslTime: number;
  ttfb: number;
  downloadTime: number;
  totalTime: number;
}

export interface NetworkSummary {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  totalTransferSize: number;
  totalTime: number;
  resourceTypes: Record<string, number>;
}

export class NetworkDomain extends EventEmitter {
  private client: CDPClient;
  private enabled = false;
  private requests: Map<string, NetworkRequest> = new Map();

  constructor(client: CDPClient) {
    super();
    this.client = client;
  }

  /**
   * Network ドメインを有効化
   */
  async enable(): Promise<void> {
    if (!this.enabled) {
      await this.client.Network.enable({
        maxTotalBufferSize: 10000000,
        maxResourceBufferSize: 5000000,
      });
      this.setupEventListeners();
      this.enabled = true;
    }
  }

  /**
   * Network ドメインを無効化
   */
  async disable(): Promise<void> {
    if (this.enabled) {
      await this.client.Network.disable();
      this.enabled = false;
    }
  }

  /**
   * イベントリスナーを設定
   *
   * 【学習ポイント】
   * ネットワークリクエストのライフサイクル:
   * 1. requestWillBeSent: リクエスト開始
   * 2. responseReceived: レスポンスヘッダー受信
   * 3. loadingFinished: 完了 or loadingFailed: 失敗
   */
  private setupEventListeners(): void {
    // リクエスト開始
    this.client.on('Network.requestWillBeSent', (params: {
      requestId: string;
      request: { url: string; method: string };
      timestamp: number;
      type?: string;
    }) => {
      const request: NetworkRequest = {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        timestamp: params.timestamp * 1000, // 秒をミリ秒に変換
        type: params.type,
        finished: false,
      };
      this.requests.set(params.requestId, request);
      this.emit('requestStart', request);
    });

    // レスポンス受信
    this.client.on('Network.responseReceived', (params: {
      requestId: string;
      response: {
        status: number;
        statusText: string;
        mimeType: string;
        timing?: NetworkRequest['timing'];
      };
    }) => {
      const request = this.requests.get(params.requestId);
      if (request) {
        request.status = params.response.status;
        request.statusText = params.response.statusText;
        request.mimeType = params.response.mimeType;
        request.timing = params.response.timing;
        this.emit('responseReceived', request);
      }
    });

    // ロード完了
    this.client.on('Network.loadingFinished', (params: {
      requestId: string;
      encodedDataLength: number;
    }) => {
      const request = this.requests.get(params.requestId);
      if (request) {
        request.finished = true;
        request.encodedDataLength = params.encodedDataLength;
        this.emit('requestComplete', request);
      }
    });

    // ロード失敗
    this.client.on('Network.loadingFailed', (params: {
      requestId: string;
      errorText: string;
    }) => {
      const request = this.requests.get(params.requestId);
      if (request) {
        request.finished = true;
        request.failed = true;
        request.errorText = params.errorText;
        this.emit('requestFailed', request);
      }
    });
  }

  /**
   * 記録されたリクエストを取得
   */
  getRequests(): NetworkRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * 記録をクリア
   */
  clearRequests(): void {
    this.requests.clear();
  }

  /**
   * リクエストのタイミングを計算
   *
   * 【学習ポイント】
   * 各フェーズの意味:
   * - DNS: ドメイン解決（キャッシュがない場合に時間がかかる）
   * - Connect: TCP 3-way handshake
   * - SSL: TLS ハンドシェイク（HTTPS の場合）
   * - TTFB: サーバー処理時間 + ネットワーク遅延
   * - Download: 実際のデータ転送時間
   */
  calculateTiming(request: NetworkRequest): NetworkTiming | null {
    const timing = request.timing;
    if (!timing) return null;

    const dnsTime = timing.dnsEnd - timing.dnsStart;
    const connectTime = timing.connectEnd - timing.connectStart;
    const sslTime = timing.sslEnd - timing.sslStart;
    const ttfb = timing.receiveHeadersEnd - timing.sendEnd;
    const downloadTime = 0; // loadingFinished までの時間から計算が必要

    return {
      dnsTime: Math.max(0, dnsTime),
      connectTime: Math.max(0, connectTime),
      sslTime: Math.max(0, sslTime),
      ttfb: Math.max(0, ttfb),
      downloadTime,
      totalTime: dnsTime + connectTime + sslTime + ttfb + downloadTime,
    };
  }

  /**
   * ネットワークサマリーを生成
   */
  getSummary(): NetworkSummary {
    const requests = this.getRequests();

    const resourceTypes: Record<string, number> = {};
    let totalTransferSize = 0;
    let completedRequests = 0;
    let failedRequests = 0;

    for (const req of requests) {
      if (req.type) {
        resourceTypes[req.type] = (resourceTypes[req.type] || 0) + 1;
      }
      if (req.encodedDataLength) {
        totalTransferSize += req.encodedDataLength;
      }
      if (req.finished) {
        if (req.failed) {
          failedRequests++;
        } else {
          completedRequests++;
        }
      }
    }

    return {
      totalRequests: requests.length,
      completedRequests,
      failedRequests,
      totalTransferSize,
      totalTime: 0, // 最初のリクエストから最後の完了までの時間
      resourceTypes,
    };
  }

  /**
   * キャッシュを無効化
   */
  async setCacheDisabled(disabled: boolean): Promise<void> {
    await this.client.Network.setCacheDisabled(disabled);
  }

  /**
   * ブラウザキャッシュをクリア
   */
  async clearCache(): Promise<void> {
    await this.client.Network.clearBrowserCache();
  }
}
