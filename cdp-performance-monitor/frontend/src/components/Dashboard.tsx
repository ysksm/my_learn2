import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ConnectionStatus } from './ConnectionStatus';
import { CpuPanel } from './CpuPanel';
import { MemoryPanel } from './MemoryPanel';
import { NetworkPanel } from './NetworkPanel';
import { VitalsPanel } from './VitalsPanel';

type TabType = 'overview' | 'cpu' | 'memory' | 'network' | 'vitals';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const ws = useWebSocket();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'cpu', label: 'CPU' },
    { id: 'memory', label: 'Memory' },
    { id: 'network', label: 'Network' },
    { id: 'vitals', label: 'Web Vitals' },
  ];

  const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatMs = (seconds: number) => `${(seconds * 1000).toFixed(1)} ms`;

  return (
    <div className="dashboard">
      {/* ヘッダー */}
      <header className="dashboard-header">
        <h1>CDP Performance Monitor</h1>
        <div className="header-controls">
          {ws.isCollecting ? (
            <button onClick={ws.stopCollection} className="btn btn-danger">
              Stop Collecting
            </button>
          ) : (
            <button
              onClick={() => ws.startCollection(1000)}
              className="btn btn-primary"
              disabled={!ws.connectionStatus?.connected}
            >
              Start Collecting
            </button>
          )}
          <button onClick={ws.clearHistory} className="btn btn-secondary">
            Clear History
          </button>
        </div>
      </header>

      {/* 接続状態 */}
      <ConnectionStatus
        isConnected={ws.isConnected}
        connectionStatus={ws.connectionStatus}
      />

      {/* エラー表示 */}
      {ws.error && (
        <div className="error-banner">
          {ws.error}
        </div>
      )}

      {/* タブ */}
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* メインコンテンツ */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h2>Overview</h2>

            {/* 学習ガイド */}
            <div className="learning-guide">
              <h3>Chrome DevTools Protocol (CDP) とは？</h3>
              <p>
                CDP は Chrome ブラウザをプログラムで制御するための WebSocket ベースのプロトコルです。
                DevTools で見られる情報はすべて CDP を通じて取得できます。
              </p>

              <h4>使い方</h4>
              <ol>
                <li>Chrome を <code>--remote-debugging-port=9222</code> で起動</li>
                <li>このダッシュボードで「Start Collecting」をクリック</li>
                <li>各タブでリアルタイムのメトリクスを確認</li>
              </ol>

              <h4>各タブの説明</h4>
              <ul>
                <li><strong>CPU</strong>: JavaScript の実行時間を分析</li>
                <li><strong>Memory</strong>: ヒープ使用量とメモリリークの検出</li>
                <li><strong>Network</strong>: ネットワークリクエストの監視</li>
                <li><strong>Web Vitals</strong>: Core Web Vitals の測定</li>
              </ul>
            </div>

            {/* クイックメトリクス */}
            {ws.metrics && (
              <div className="quick-metrics">
                <h3>Current Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">JS Heap Used</div>
                    <div className="metric-value">{formatMB(ws.metrics.memory.jsHeapUsedSize)}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">DOM Nodes</div>
                    <div className="metric-value">{ws.metrics.memory.nodesCount.toLocaleString()}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Script Duration</div>
                    <div className="metric-value">{formatMs(ws.metrics.cpu.scriptDuration)}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Network Requests</div>
                    <div className="metric-value">{ws.metrics.network.totalRequests}</div>
                  </div>
                  {ws.metrics.vitals.lcp && (
                    <div className="metric-card">
                      <div className="metric-label">LCP</div>
                      <div className="metric-value">{ws.metrics.vitals.lcp.toFixed(0)} ms</div>
                    </div>
                  )}
                  {ws.metrics.vitals.fcp && (
                    <div className="metric-card">
                      <div className="metric-label">FCP</div>
                      <div className="metric-value">{ws.metrics.vitals.fcp.toFixed(0)} ms</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cpu' && (
          <CpuPanel
            metrics={ws.metrics}
            metricsHistory={ws.metricsHistory}
            isProfiling={ws.isProfiling}
            profileSummary={ws.profileSummary}
            onStartProfiling={ws.startCpuProfiling}
            onStopProfiling={ws.stopCpuProfiling}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryPanel
            metrics={ws.metrics}
            metricsHistory={ws.metricsHistory}
            onTakeSnapshot={ws.takeHeapSnapshot}
            onCollectGarbage={ws.collectGarbage}
          />
        )}

        {activeTab === 'network' && (
          <NetworkPanel
            metrics={ws.metrics}
            onClearNetwork={ws.clearNetwork}
          />
        )}

        {activeTab === 'vitals' && (
          <VitalsPanel
            metrics={ws.metrics}
            onReloadPage={ws.reloadPage}
          />
        )}
      </main>
    </div>
  );
}
