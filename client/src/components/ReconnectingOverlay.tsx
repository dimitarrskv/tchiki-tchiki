import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';

export function ReconnectingOverlay() {
  const { connectionState, isConnected } = useSocket();
  const { room } = useGame();

  // Only show when in a room and disconnected/reconnecting
  if (!room) return null;
  if (isConnected && connectionState === 'connected') return null;
  if (connectionState === 'reconnected') return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center p-6">
        <div
          className="connection-spinner mx-auto mb-4"
          style={{ width: 48, height: 48, borderWidth: 3 }}
        />
        <div className="text-primary font-mono text-xl mb-2">
          {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connection Lost'}
        </div>
        <div className="text-text-muted text-sm font-mono">
          {connectionState === 'reconnecting'
            ? 'Hang tight, getting you back in'
            : 'Trying to reconnect...'}
        </div>
      </div>
    </div>
  );
}
