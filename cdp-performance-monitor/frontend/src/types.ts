/**
 * フロントエンド用型定義
 */

// メトリクス型
export interface CPUMetrics {
  timestamp: number;
  isRecording: boolean;
  scriptDuration: number;
  taskDuration: number;
  jsHeapUsedSize: number;
}

export interface MemoryMetrics {
  timestamp: number;
  jsHeapUsedSize: number;
  jsHeapTotalSize: number;
  documentsCount: number;
  nodesCount: number;
  listenersCount: number;
}

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  timestamp: number;
  type?: string;
  status?: number;
  statusText?: string;
  mimeType?: string;
  encodedDataLength?: number;
  finished?: boolean;
  failed?: boolean;
  errorText?: string;
}

export interface NetworkMetrics {
  timestamp: number;
  requests: NetworkRequest[];
  totalRequests: number;
  failedRequests: number;
  totalTransferSize: number;
}

export interface WebVitals {
  timestamp: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

export interface AllMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  vitals: WebVitals;
}

// 接続状態
export interface ConnectionStatus {
  connected: boolean;
  browserInfo?: {
    browser: string;
    protocolVersion: string;
    userAgent: string;
  };
  targetInfo?: {
    id: string;
    type: string;
    title: string;
    url: string;
  };
}

// CPU プロファイル
export interface CPUProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount?: number;
  children?: number[];
}

export interface CPUProfile {
  nodes: CPUProfileNode[];
  startTime: number;
  endTime: number;
  samples?: number[];
  timeDeltas?: number[];
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

// WebSocket メッセージ
export type WebSocketMessageType =
  | 'connection_status'
  | 'metrics'
  | 'cpu_profile'
  | 'heap_snapshot_progress'
  | 'heap_snapshot_complete'
  | 'network_request'
  | 'vitals_update'
  | 'error';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  data: T;
}
