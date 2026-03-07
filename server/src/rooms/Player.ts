import { PlayerInfo } from 'shared';

export class Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  spotifyDeviceId: string | null;
  disconnectedAt: number | null;

  constructor(id: string, name: string, socketId: string, isHost: boolean) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isReady = false;
    this.isConnected = true;
    this.spotifyDeviceId = null;
    this.disconnectedAt = null;
  }

  toInfo(): PlayerInfo {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      isReady: this.isReady,
      isConnected: this.isConnected,
    };
  }

  disconnect(): void {
    this.isConnected = false;
    this.disconnectedAt = Date.now();
  }

  reconnect(socketId: string): void {
    this.socketId = socketId;
    this.isConnected = true;
    this.disconnectedAt = null;
  }

  isGhost(timeoutMs: number = 30000): boolean {
    if (this.isConnected || this.disconnectedAt === null) return false;
    return Date.now() - this.disconnectedAt > timeoutMs;
  }
}
