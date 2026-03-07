import { useSocket } from '../context/SocketContext';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { isConnected, connectionState } = useSocket();

  // Don't show anything when connected and stable
  if (isConnected && connectionState === 'connected') {
    return null;
  }

  return (
    <div className={`connection-status ${connectionState}`}>
      {connectionState === 'reconnecting' && (
        <>
          <div className="connection-spinner" />
          <span>Reconnecting...</span>
        </>
      )}
      {connectionState === 'disconnected' && (
        <>
          <span className="connection-icon">⚠️</span>
          <span>Connection lost</span>
        </>
      )}
      {connectionState === 'reconnected' && (
        <>
          <span className="connection-icon">✓</span>
          <span>Reconnected!</span>
        </>
      )}
    </div>
  );
}
