import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from 'shared/src/types';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying indefinitely
      reconnectionDelay: 500, // Start faster (500ms)
      reconnectionDelayMax: 5000, // Max 5s between attempts
      timeout: 10000, // 10s connection timeout
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
    });
  }
  return socket;
}

export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}
