import { Server } from 'socket.io';
import { Room } from '../rooms/Room';
import { GamePhase, ClientToServerEvents, ServerToClientEvents } from 'shared';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export interface GameConfig {
  listenDurationMs: number;
  discussionDurationMs: number;
  votingDurationMs: number;
}

const DEFAULT_CONFIG: GameConfig = {
  listenDurationMs: 25_000,    // 25 seconds of listening
  discussionDurationMs: 45_000, // 45 seconds of discussion
  votingDurationMs: 30_000,     // 30 seconds to vote
};

export abstract class BaseGame {
  protected io: TypedServer;
  protected room: Room;
  protected config: GameConfig;
  protected timers: NodeJS.Timeout[] = [];

  constructor(io: TypedServer, room: Room, config?: Partial<GameConfig>) {
    this.io = io;
    this.room = room;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  abstract start(): void;
  abstract handleClaimMatch(playerId: string, partnerId: string): void;

  protected emit(event: string, data?: any): void {
    this.io.to(this.room.code).emit(event as any, data);
  }

  protected emitToPlayer(socketId: string, event: string, data?: any): void {
    this.io.to(socketId).emit(event as any, data);
  }

  protected setPhase(phase: GamePhase, data?: any): void {
    this.room.phase = phase;
    this.emit('game:phaseChange', { phase, data });
    this.emit('room:updated', { room: this.room.toState() });
  }

  protected scheduleTimeout(callback: () => void, ms: number): void {
    const timer = setTimeout(callback, ms);
    this.timers.push(timer);
  }

  protected getConnectedPlayers() {
    return Array.from(this.room.players.values()).filter(p => p.isConnected);
  }

  protected getPlayerIds(): string[] {
    return this.getConnectedPlayers().map(p => p.id);
  }

  cleanup(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }
}
