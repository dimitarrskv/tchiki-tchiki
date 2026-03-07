import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { connectSocket, disconnectSocket, TypedSocket } from '../lib/socket';
import { getSession } from '../lib/sessionStorage';

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  isRejoining: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  connectionState: 'disconnected',
  isRejoining: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isRejoining, setIsRejoining] = useState(false);

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    function onConnect() {
      setIsConnected(true);
      console.log('Socket connected');

      // Check for existing session and auto-rejoin
      const session = getSession();
      if (session) {
        console.log('Found existing session, attempting to rejoin room:', session.roomCode);
        setIsRejoining(true);
        s.emit('room:rejoin', {
          code: session.roomCode,
          playerId: session.playerId,
          playerName: session.playerName,
        });
      }

      // Show reconnected state briefly if this was a reconnection
      if (connectionState === 'reconnecting') {
        setConnectionState('reconnected');
        setTimeout(() => {
          setConnectionState('connected');
        }, 3000); // Show "reconnected" for 3 seconds
      } else {
        setConnectionState('connected');
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setConnectionState('disconnected');
      console.log('Socket disconnected');
    }

    function onReconnecting(attempt: number) {
      setConnectionState('reconnecting');
      console.log(`Reconnecting... (attempt ${attempt})`);
    }

    function onReconnectError(err: Error) {
      console.error('Reconnection error:', err);
    }

    // Handle rejoin completion
    function onRoomRejoined() {
      console.log('Rejoin successful');
      setIsRejoining(false);
    }

    function onRoomError({ message }: { message: string }) {
      if (message.includes('rejoin')) {
        console.log('Rejoin failed:', message);
        setIsRejoining(false);
      }
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.io.on('reconnect_attempt', onReconnecting);
    s.io.on('reconnect_error', onReconnectError);
    s.on('room:rejoined', onRoomRejoined);
    s.on('room:error', onRoomError);

    if (s.connected) {
      setIsConnected(true);
      setConnectionState('connected');
    }

    // Network change detection
    const handleOnline = () => {
      console.log('Network online, reconnecting...');
      if (!s.connected) {
        s.connect();
      }
    };

    const handleOffline = () => {
      console.log('Network offline');
      setConnectionState('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.io.off('reconnect_attempt', onReconnecting);
      s.io.off('reconnect_error', onReconnectError);
      s.off('room:rejoined', onRoomRejoined);
      s.off('room:error', onRoomError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      disconnectSocket();
    };
  }, [connectionState]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState, isRejoining }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
