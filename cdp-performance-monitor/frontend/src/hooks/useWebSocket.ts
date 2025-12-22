import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, ConnectionStatus, AllMetrics, CPUProfile, ProfileSummary } from '../types';

export interface WebSocketState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus | null;
  metrics: AllMetrics | null;
  metricsHistory: AllMetrics[];
  isCollecting: boolean;
  cpuProfile: CPUProfile | null;
  profileSummary: ProfileSummary | null;
  isProfiling: boolean;
  error: string | null;
}

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const MAX_HISTORY = 60; // 60秒分のデータ

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionStatus: null,
    metrics: null,
    metricsHistory: [],
    isCollecting: false,
    cpuProfile: null,
    profileSummary: null,
    isProfiling: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setState((s) => ({ ...s, isConnected: true, error: null }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        handleMessage(message);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, isConnected: false }));
      // 再接続
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, error: 'WebSocket connection error' }));
    };

    wsRef.current = ws;
  }, []);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_status':
        setState((s) => ({
          ...s,
          connectionStatus: message.data as ConnectionStatus,
        }));
        break;

      case 'metrics': {
        const data = message.data as AllMetrics | { status: string };
        if ('cpu' in data) {
          setState((s) => ({
            ...s,
            metrics: data,
            metricsHistory: [...s.metricsHistory.slice(-MAX_HISTORY + 1), data],
          }));
        } else if (data.status === 'collection_started') {
          setState((s) => ({ ...s, isCollecting: true }));
        } else if (data.status === 'collection_stopped') {
          setState((s) => ({ ...s, isCollecting: false }));
        }
        break;
      }

      case 'cpu_profile': {
        const data = message.data as { status: string; profile?: CPUProfile; summary?: ProfileSummary };
        if (data.status === 'started') {
          setState((s) => ({ ...s, isProfiling: true }));
        } else if (data.status === 'stopped' && data.profile) {
          setState((s) => ({
            ...s,
            isProfiling: false,
            cpuProfile: data.profile ?? null,
            profileSummary: data.summary ?? null,
          }));
        }
        break;
      }

      case 'error':
        setState((s) => ({
          ...s,
          error: (message.data as { message: string }).message,
        }));
        break;
    }
  };

  const send = useCallback((action: string, payload?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);

  // アクション関数
  const startCollection = useCallback((interval = 1000) => {
    send('start_metrics_collection', { interval });
  }, [send]);

  const stopCollection = useCallback(() => {
    send('stop_metrics_collection');
  }, [send]);

  const startCpuProfiling = useCallback(() => {
    send('start_cpu_profiling');
  }, [send]);

  const stopCpuProfiling = useCallback(() => {
    send('stop_cpu_profiling');
  }, [send]);

  const takeHeapSnapshot = useCallback(() => {
    send('take_heap_snapshot');
  }, [send]);

  const collectGarbage = useCallback(() => {
    send('collect_garbage');
  }, [send]);

  const reloadPage = useCallback((ignoreCache = false) => {
    send('reload_page', { ignoreCache });
  }, [send]);

  const navigateTo = useCallback((url: string) => {
    send('navigate', { url });
  }, [send]);

  const clearNetwork = useCallback(() => {
    send('clear_network');
  }, [send]);

  const clearHistory = useCallback(() => {
    setState((s) => ({ ...s, metricsHistory: [] }));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    startCollection,
    stopCollection,
    startCpuProfiling,
    stopCpuProfiling,
    takeHeapSnapshot,
    collectGarbage,
    reloadPage,
    navigateTo,
    clearNetwork,
    clearHistory,
  };
}
