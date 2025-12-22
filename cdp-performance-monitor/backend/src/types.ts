/**
 * CDP Performance Monitor 型定義
 */

// ============================================================
// CDP 関連の型
// ============================================================

export interface PerformanceMetric {
  name: string;
  value: number;
}

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
  positionTicks?: Array<{
    line: number;
    ticks: number;
  }>;
}

export interface CPUProfile {
  nodes: CPUProfileNode[];
  startTime: number;
  endTime: number;
  samples?: number[];
  timeDeltas?: number[];
}

export interface HeapSnapshotChunk {
  chunk: string;
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
  timing?: {
    requestTime: number;
    dnsStart: number;
    dnsEnd: number;
    connectStart: number;
    connectEnd: number;
    sslStart: number;
    sslEnd: number;
    sendStart: number;
    sendEnd: number;
    receiveHeadersEnd: number;
  };
  finished?: boolean;
  failed?: boolean;
  errorText?: string;
}

export interface PageLifecycleEvent {
  name: string;
  timestamp: number;
}

// ============================================================
// メトリクス型
// ============================================================

export interface CPUMetrics {
  timestamp: number;
  isRecording: boolean;
  scriptDuration: number;
  taskDuration: number;
  jsHeapUsedSize: number;
  profile?: CPUProfile;
}

export interface MemoryMetrics {
  timestamp: number;
  jsHeapUsedSize: number;
  jsHeapTotalSize: number;
  documentsCount: number;
  nodesCount: number;
  listenersCount: number;
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
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  fcp?: number;  // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface AllMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  vitals: WebVitals;
}

// ============================================================
// WebSocket メッセージ型
// ============================================================

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

export interface ClientAction {
  action: string;
  payload?: Record<string, unknown>;
}

// ============================================================
// 接続状態
// ============================================================

export interface ConnectionStatus {
  connected: boolean;
  browserInfo?: {
    browser: string;
    protocolVersion: string;
    userAgent: string;
    webSocketDebuggerUrl?: string;
  };
  targetInfo?: {
    id: string;
    type: string;
    title: string;
    url: string;
  };
}
