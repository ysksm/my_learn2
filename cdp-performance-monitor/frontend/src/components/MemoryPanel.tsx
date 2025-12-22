import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AllMetrics } from '../types';

interface Props {
  metrics: AllMetrics | null;
  metricsHistory: AllMetrics[];
  onTakeSnapshot: () => void;
  onCollectGarbage: () => void;
}

export function MemoryPanel({
  metrics,
  metricsHistory,
  onTakeSnapshot,
  onCollectGarbage,
}: Props) {
  // チャート用データを整形
  const chartData = metricsHistory.map((m, index) => ({
    time: index,
    heapUsed: m.memory.jsHeapUsedSize / (1024 * 1024), // MB
    heapTotal: m.memory.jsHeapTotalSize / (1024 * 1024),
  }));

  const formatMB = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const heapUsagePercent = metrics
    ? ((metrics.memory.jsHeapUsedSize / metrics.memory.jsHeapTotalSize) * 100).toFixed(1)
    : '0';

  return (
    <div className="panel memory-panel">
      <h2>Memory Analysis</h2>

      {/* 学習ポイント */}
      <div className="learning-note">
        <h4>学習ポイント</h4>
        <p>
          メモリ分析は JavaScript ヒープの使用状況を監視し、
          メモリリークを検出するのに役立ちます。
        </p>
        <ul>
          <li><strong>Heap Used</strong>: 実際に使用中のヒープサイズ</li>
          <li><strong>Heap Total</strong>: 確保されたヒープの合計サイズ</li>
          <li><strong>DOM Nodes</strong>: 多すぎるとメモリを圧迫</li>
          <li><strong>Event Listeners</strong>: 解除忘れがメモリリークの原因に</li>
        </ul>
        <p>
          <strong>メモリリーク検出手順:</strong>
          <br />1. GC を実行
          <br />2. 操作を繰り返し実行
          <br />3. GC を再実行
          <br />4. ヒープサイズが増加し続けていればリークの可能性
        </p>
      </div>

      {/* 操作ボタン */}
      <div className="memory-controls">
        <button onClick={onCollectGarbage} className="btn btn-secondary">
          Force GC
        </button>
        <button onClick={onTakeSnapshot} className="btn btn-primary">
          Take Heap Snapshot
        </button>
      </div>

      {/* 現在のメトリクス */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Heap Used</div>
            <div className="metric-value">{formatMB(metrics.memory.jsHeapUsedSize)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Heap Total</div>
            <div className="metric-value">{formatMB(metrics.memory.jsHeapTotalSize)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Usage</div>
            <div className="metric-value">{heapUsagePercent}%</div>
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{ width: `${heapUsagePercent}%` }}
              />
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">DOM Nodes</div>
            <div className="metric-value">{metrics.memory.nodesCount.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Documents</div>
            <div className="metric-value">{metrics.memory.documentsCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Event Listeners</div>
            <div className="metric-value">{metrics.memory.listenersCount.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* チャート */}
      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>Memory Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}MB`} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
              <Line
                type="monotone"
                dataKey="heapUsed"
                stroke="#8884d8"
                name="Used"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="heapTotal"
                stroke="#82ca9d"
                name="Total"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
