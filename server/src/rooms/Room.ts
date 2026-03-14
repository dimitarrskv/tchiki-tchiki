import { GamePhase, GameMode, RoomState } from 'shared';
import { Player } from './Player';

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 4;

export class Room {
  code: string;
  host: Player;
  players: Map<string, Player>;
  phase: GamePhase;
  currentMode: GameMode | null;
  roundNumber: number;
  roundLimit: number;
  scores: Map<string, number>;
  createdAt: Date;

  constructor(code: string, host: Player) {
    this.code = code;
    this.host = host;
    this.players = new Map();
    this.players.set(host.id, host);
    this.phase = GamePhase.LOBBY;
    this.currentMode = null;
    this.roundNumber = 0;
    this.roundLimit = 5;
    this.scores = new Map();
    this.scores.set(host.id, 0);
    this.createdAt = new Date();
  }

  addPlayer(player: Player): void {
    if (this.players.size >= MAX_PLAYERS) {
      throw new Error('Room is full');
    }
    if (this.phase !== GamePhase.LOBBY) {
      throw new Error('Game already in progress');
    }
    this.players.set(player.id, player);
    this.scores.set(player.id, 0);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.scores.delete(playerId);

    // If the host left, assign a new host
    if (this.host.id === playerId) {
      const remaining = Array.from(this.players.values());
      if (remaining.length > 0) {
        remaining[0].isHost = true;
        this.host = remaining[0];
      }
    }
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return Array.from(this.players.values()).find(p => p.socketId === socketId);
  }

  getPlayerById(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  get playerCount(): number {
    return this.players.size;
  }

  get connectedPlayerCount(): number {
    return Array.from(this.players.values()).filter(p => p.isConnected).length;
  }

  get allPlayersReady(): boolean {
    return Array.from(this.players.values()).every(p => p.isReady);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  toState(): RoomState {
    return {
      code: this.code,
      hostId: this.host.id,
      players: Array.from(this.players.values()).map(p => p.toInfo()),
      phase: this.phase,
      currentMode: this.currentMode,
      roundNumber: this.roundNumber,
      roundLimit: this.roundLimit,
      scores: Object.fromEntries(this.scores),
    };
  }
}
