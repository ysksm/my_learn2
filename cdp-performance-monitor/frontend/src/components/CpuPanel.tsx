import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AllMetrics, ProfileSummary } from '../types';

interface Props {
  metrics: AllMetrics | null;
  metricsHistory: AllMetrics[];
  isProfiling: boolean;
  profileSummary: ProfileSummary | null;
  onStartProfiling: () => void;
  onStopProfiling: () => void;
}

export function CpuPanel({
  metrics,
  metricsHistory,
  isProfiling,
  profileSummary,
  onStartProfiling,
  onStopProfiling,
}: Props) {
  // チャート用データを整形
  const chartData = metricsHistory.map((m, index) => ({
    time: index,
    scriptDuration: m.cpu.scriptDuration * 1000, // 秒をミリ秒に
    taskDuration: m.cpu.taskDuration * 1000,
  }));

  const formatMs = (value: number) => `${value.toFixed(2)} ms`;
  const formatHeap = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="panel cpu-panel">
      <h2>CPU Profiling</h2>

      {/* 学習ポイント */}
      <div className="learning-note">
        <h4>学習ポイント</h4>
        <p>
          CPU プロファイリングは JavaScript の実行時間を分析し、
          パフォーマンスボトルネックを特定します。
        </p>
        <ul>
          <li><strong>Script Duration</strong>: JavaScript コードの実行時間</li>
          <li><strong>Task Duration</strong>: 全タスク（レンダリング含む）の実行時間</li>
          <li><strong>Top Functions</strong>: 最も時間を消費している関数</li>
        </ul>
      </div>

      {/* プロファイリング制御 */}
      <div className="profiling-controls">
        {isProfiling ? (
          <button onClick={onStopProfiling} className="btn btn-danger">
            Stop Profiling
          </button>
        ) : (
          <button onClick={onStartProfiling} className="btn btn-primary">
            Start Profiling
          </button>
        )}
        {isProfiling && <span className="recording-indicator">Recording...</span>}
      </div>

      {/* 現在のメトリクス */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Script Duration</div>
            <div className="metric-value">{formatMs(metrics.cpu.scriptDuration * 1000)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Task Duration</div>
            <div className="metric-value">{formatMs(metrics.cpu.taskDuration * 1000)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">JS Heap Used</div>
            <div className="metric-value">{formatHeap(metrics.cpu.jsHeapUsedSize)}</div>
          </div>
        </div>
      )}

      {/* チャート */}
      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>CPU Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}ms`} />
              <Tooltip formatter={(value: number) => formatMs(value)} />
              <Line
                type="monotone"
                dataKey="scriptDuration"
                stroke="#8884d8"
                name="Script"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="taskDuration"
                stroke="#82ca9d"
                name="Task"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* プロファイル結果 */}
      {profileSummary && (
        <div className="profile-result">
          <h3>Profile Result</h3>
          <div className="profile-summary">
            <p>Total Time: {(profileSummary.totalTime / 1000).toFixed(2)} ms</p>
            <p>Samples: {profileSummary.sampleCount}</p>
          </div>
          <h4>Top Functions</h4>
          <table className="function-table">
            <thead>
              <tr>
                <th>Function</th>
                <th>Self Time</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {profileSummary.topFunctions.map((fn, i) => (
                <tr key={i}>
                  <td className="function-name">
                    {fn.name}
                    {fn.url && <span className="function-url">{fn.url}</span>}
                  </td>
                  <td>{(fn.selfTime / 1000).toFixed(2)} ms</td>
                  <td>{fn.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
