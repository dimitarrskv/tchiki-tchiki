import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { connectSocket, disconnectSocket, TypedSocket } from '../lib/socket';
import { getSession, clearSession } from '../lib/sessionStorage';

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';

const REJOIN_TIMEOUT_MS = 5000;

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
  const connectionStateRef = useRef<ConnectionState>('disconnected');
  const rejoinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        // Timeout rejoin after 5s to prevent infinite loading screen
        rejoinTimeoutRef.current = setTimeout(() => {
          console.log('Rejoin timed out');
          setIsRejoining(false);
          clearSession();
        }, REJOIN_TIMEOUT_MS);

        s.emit('room:rejoin', {
          code: session.roomCode,
          playerId: session.playerId,
          playerName: session.playerName,
        });
      }

      // Show reconnected state briefly if this was a reconnection
      if (connectionStateRef.current === 'reconnecting') {
        setConnectionState('reconnected');
        connectionStateRef.current = 'reconnected';
        setTimeout(() => {
          setConnectionState('connected');
          connectionStateRef.current = 'connected';
        }, 3000);
      } else {
        setConnectionState('connected');
        connectionStateRef.current = 'connected';
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setConnectionState('disconnected');
      connectionStateRef.current = 'disconnected';
      console.log('Socket disconnected');
    }

    function onReconnecting(attempt: number) {
      setConnectionState('reconnecting');
      connectionStateRef.current = 'reconnecting';
      console.log(`Reconnecting... (attempt ${attempt})`);
    }

    function onReconnectError(err: Error) {
      console.error('Reconnection error:', err);
    }

    // Handle rejoin completion
    function onRoomRejoined() {
      console.log('Rejoin successful');
      setIsRejoining(false);
      if (rejoinTimeoutRef.current) {
        clearTimeout(rejoinTimeoutRef.current);
        rejoinTimeoutRef.current = null;
      }
    }

    function onRoomError({ message }: { message: string }) {
      if (message.includes('rejoin') || message.includes('Could not rejoin')) {
        console.log('Rejoin failed:', message);
        setIsRejoining(false);
        if (rejoinTimeoutRef.current) {
          clearTimeout(rejoinTimeoutRef.current);
          rejoinTimeoutRef.current = null;
        }
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
      connectionStateRef.current = 'connected';
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
      connectionStateRef.current = 'disconnected';
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
      if (rejoinTimeoutRef.current) clearTimeout(rejoinTimeoutRef.current);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState, isRejoining }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext };

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
