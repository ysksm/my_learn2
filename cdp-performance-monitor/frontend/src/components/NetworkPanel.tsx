import type { AllMetrics, NetworkRequest } from '../types';

interface Props {
  metrics: AllMetrics | null;
  onClearNetwork: () => void;
}

export function NetworkPanel({ metrics, onClearNetwork }: Props) {
  const requests = metrics?.network.requests ?? [];

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusClass = (status?: number) => {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400) return 'status-error';
    return '';
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'Document': return '📄';
      case 'Script': return '📜';
      case 'Stylesheet': return '🎨';
      case 'Image': return '🖼️';
      case 'Font': return '🔤';
      case 'XHR': return '📡';
      case 'Fetch': return '📡';
      default: return '📦';
    }
  };

  // リソースタイプ別の集計
  const resourceSummary: Record<string, { count: number; size: number }> = {};
  requests.forEach((req) => {
    const type = req.type || 'Other';
    if (!resourceSummary[type]) {
      resourceSummary[type] = { count: 0, size: 0 };
    }
    resourceSummary[type].count++;
    resourceSummary[type].size += req.encodedDataLength || 0;
  });

  return (
    <div className="panel network-panel">
      <h2>Network Monitor</h2>

      {/* 学習ポイント */}
      <div className="learning-note">
        <h4>学習ポイント</h4>
        <p>
          ネットワーク分析では、ページロードを遅くしているリソースを特定できます。
        </p>
        <ul>
          <li><strong>リソース数</strong>: 少ないほど良い（バンドル化を検討）</li>
          <li><strong>転送サイズ</strong>: 圧縮・最小化で削減可能</li>
          <li><strong>失敗リクエスト</strong>: 404エラーなどがないか確認</li>
        </ul>
        <p>
          <strong>最適化のヒント:</strong>
          <br />- 大きな画像は適切なサイズに圧縮
          <br />- JavaScriptは遅延ロード
          <br />- CSSはインライン化を検討
        </p>
      </div>

      {/* 操作ボタン */}
      <div className="network-controls">
        <button onClick={onClearNetwork} className="btn btn-secondary">
          Clear
        </button>
      </div>

      {/* サマリー */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{metrics.network.totalRequests}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Failed</div>
            <div className={`metric-value ${metrics.network.failedRequests > 0 ? 'error' : ''}`}>
              {metrics.network.failedRequests}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Transfer Size</div>
            <div className="metric-value">{formatSize(metrics.network.totalTransferSize)}</div>
          </div>
        </div>
      )}

      {/* リソースタイプ別サマリー */}
      {Object.keys(resourceSummary).length > 0 && (
        <div className="resource-summary">
          <h3>By Resource Type</h3>
          <div className="resource-type-grid">
            {Object.entries(resourceSummary).map(([type, data]) => (
              <div key={type} className="resource-type-card">
                <span className="resource-icon">{getTypeIcon(type)}</span>
                <span className="resource-type">{type}</span>
                <span className="resource-count">{data.count}</span>
                <span className="resource-size">{formatSize(data.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* リクエスト一覧 */}
      <div className="request-list">
        <h3>Requests ({requests.length})</h3>
        <div className="request-table-container">
          <table className="request-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Method</th>
                <th>URL</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(-50).reverse().map((req: NetworkRequest) => (
                <tr key={req.requestId} className={req.failed ? 'failed' : ''}>
                  <td>{getTypeIcon(req.type)} {req.type || 'Other'}</td>
                  <td className={getStatusClass(req.status)}>
                    {req.failed ? 'Failed' : req.status || '-'}
                  </td>
                  <td>{req.method}</td>
                  <td className="url-cell" title={req.url}>
                    {new URL(req.url).pathname}
                  </td>
                  <td>{formatSize(req.encodedDataLength)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
