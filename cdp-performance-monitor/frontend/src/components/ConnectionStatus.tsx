import type { ConnectionStatus as ConnectionStatusType } from '../types';

interface Props {
  isConnected: boolean;
  connectionStatus: ConnectionStatusType | null;
}

export function ConnectionStatus({ isConnected, connectionStatus }: Props) {
  const cdpConnected = connectionStatus?.connected ?? false;

  return (
    <div className="connection-status">
      <div className="status-row">
        <span className="status-label">WebSocket:</span>
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="status-row">
        <span className="status-label">Chrome CDP:</span>
        <span className={`status-indicator ${cdpConnected ? 'connected' : 'disconnected'}`}>
          {cdpConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      {connectionStatus?.targetInfo && (
        <div className="target-info">
          <div className="target-title">{connectionStatus.targetInfo.title}</div>
          <div className="target-url">{connectionStatus.targetInfo.url}</div>
        </div>
      )}
    </div>
  );
}
