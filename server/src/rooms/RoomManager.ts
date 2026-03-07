import { v4 as uuidv4 } from 'uuid';
import { Room } from './Room';
import { Player } from './Player';

const GHOST_TIMEOUT_MS = 30000; // 30 seconds
const ROOM_CLEANUP_INTERVAL_MS = 60000; // 1 minute

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomCode
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean up ghost players and empty rooms
    this.cleanupInterval = setInterval(() => this.cleanup(), ROOM_CLEANUP_INTERVAL_MS);
  }

  createRoom(socketId: string, playerName: string): Room {
    // Generate unique code
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const playerId = uuidv4();
    const host = new Player(playerId, playerName, socketId, true);
    const room = new Room(code, host);

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, code);

    console.log(`Room ${code} created by ${playerName} (${playerId})`);
    return room;
  }

  joinRoom(code: string, socketId: string, playerName: string): { room: Room; player: Player } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      throw new Error('Room not found');
    }

    const playerId = uuidv4();
    const player = new Player(playerId, playerName, socketId, false);
    room.addPlayer(player); // Throws if full or game in progress

    this.socketToRoom.set(socketId, code);

    console.log(`${playerName} (${playerId}) joined room ${code}`);
    return { room, player };
  }

  getRoomByCode(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  getPlayerBySocketId(socketId: string): { room: Room; player: Player } | undefined {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return undefined;
    const player = room.getPlayerBySocketId(socketId);
    if (!player) return undefined;
    return { room, player };
  }

  handleDisconnect(socketId: string): { room: Room; player: Player } | undefined {
    const result = this.getPlayerBySocketId(socketId);
    if (!result) return undefined;

    const { room, player } = result;
    player.disconnect();
    this.socketToRoom.delete(socketId);

    console.log(`${player.name} disconnected from room ${room.code} (ghost for 30s)`);
    return result;
  }

  handleReconnect(socketId: string, playerId: string, roomCode: string): { room: Room; player: Player } | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;

    const player = room.getPlayerById(playerId);
    if (!player || player.isConnected) return undefined;

    player.reconnect(socketId);
    this.socketToRoom.set(socketId, roomCode);

    console.log(`${player.name} reconnected to room ${roomCode}`);
    return { room, player };
  }

  private cleanup(): void {
    for (const [code, room] of this.rooms) {
      // Remove ghost players
      for (const [playerId, player] of room.players) {
        if (player.isGhost(GHOST_TIMEOUT_MS)) {
          console.log(`Removing ghost player ${player.name} from room ${code}`);
          room.removePlayer(playerId);
        }
      }

      // Remove empty rooms
      if (room.isEmpty()) {
        console.log(`Removing empty room ${code}`);
        this.rooms.delete(code);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }

  get roomCount(): number {
    return this.rooms.size;
  }
}
