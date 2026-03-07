import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  PlayerReadyPayload,
  GameSelectPayload,
  VotePayload,
  ClaimMatchPayload,
  CatchPlayerPayload,
  GamePhase,
  GameMode,
} from 'shared/src/types';
import { RoomManager } from '../rooms/RoomManager';
import { BaseGame } from '../games/BaseGame';
import { OddOneOut } from '../games/OddOneOut';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Active games per room
const activeGames = new Map<string, BaseGame>();

function createGame(io: TypedServer, room: any, mode: GameMode): BaseGame {
  switch (mode) {
    case GameMode.ODD_ONE_OUT:
      return new OddOneOut(io, room);
    case GameMode.MUSIC_PAIRS:
      // TODO: Implement in Milestone 4
      return new OddOneOut(io, room); // Fallback for now
    case GameMode.FREEZE:
      // TODO: Implement in Milestone 4
      return new OddOneOut(io, room); // Fallback for now
    default:
      return new OddOneOut(io, room);
  }
}

export function registerSocketHandlers(io: TypedServer, roomManager: RoomManager): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── Room Events ───────────────────────────────────────

    socket.on('room:create', (payload: CreateRoomPayload) => {
      try {
        const parsed = CreateRoomPayload.parse(payload);
        const room = roomManager.createRoom(socket.id, parsed.playerName);

        socket.join(room.code);

        socket.emit('room:created', {
          code: room.code,
          room: room.toState(),
        });
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to create room' });
      }
    });

    socket.on('room:join', (payload: JoinRoomPayload) => {
      try {
        const parsed = JoinRoomPayload.parse(payload);
        const { room, player } = roomManager.joinRoom(parsed.code, socket.id, parsed.playerName);

        socket.join(room.code);
        socket.emit('room:joined', { room: room.toState() });
        socket.to(room.code).emit('room:playerJoined', { player: player.toInfo() });
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to join room' });
      }
    });

    socket.on('room:leave', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      room.removePlayer(player.id);
      socket.leave(room.code);

      io.to(room.code).emit('room:playerLeft', { playerId: player.id });

      if (!room.isEmpty()) {
        io.to(room.code).emit('room:updated', { room: room.toState() });
      } else {
        // Clean up game if room is empty
        const game = activeGames.get(room.code);
        if (game) {
          game.cleanup();
          activeGames.delete(room.code);
        }
      }
    });

    // ─── Player Events ─────────────────────────────────────

    socket.on('player:ready', (payload: PlayerReadyPayload) => {
      try {
        const parsed = PlayerReadyPayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const { room, player } = result;
        player.spotifyDeviceId = parsed.spotifyDeviceId;
        player.isReady = true;

        io.to(room.code).emit('room:updated', { room: room.toState() });
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to set ready' });
      }
    });

    // ─── Game Events ───────────────────────────────────────

    socket.on('game:start', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;

      if (!player.isHost) {
        socket.emit('room:error', { message: 'Only the host can start the game' });
        return;
      }

      if (room.phase !== GamePhase.LOBBY && room.phase !== GamePhase.RESULTS) {
        socket.emit('room:error', { message: 'Cannot start game in current phase' });
        return;
      }

      room.phase = GamePhase.MODE_SELECT;
      io.to(room.code).emit('game:phaseChange', { phase: GamePhase.MODE_SELECT });
      io.to(room.code).emit('room:updated', { room: room.toState() });
    });

    socket.on('game:select', (payload: GameSelectPayload) => {
      try {
        const parsed = GameSelectPayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const { room, player } = result;

        if (!player.isHost) {
          socket.emit('room:error', { message: 'Only the host can select a game mode' });
          return;
        }

        room.currentMode = parsed.mode;

        // Clean up any previous game
        const prevGame = activeGames.get(room.code);
        if (prevGame) {
          prevGame.cleanup();
        }

        // Create and start the game
        const game = createGame(io, room, parsed.mode);
        activeGames.set(room.code, game);

        io.to(room.code).emit('game:modeSelected', { mode: parsed.mode });
        game.start();
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to select game' });
      }
    });

    socket.on('game:vote', (payload: VotePayload) => {
      try {
        const parsed = VotePayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const game = activeGames.get(result.room.code);
        if (game) {
          game.handleVote(result.player.id, parsed.targetPlayerId);
        }
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to vote' });
      }
    });

    socket.on('game:claimMatch', (payload: ClaimMatchPayload) => {
      try {
        const parsed = ClaimMatchPayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const game = activeGames.get(result.room.code);
        if (game) {
          game.handleClaimMatch(result.player.id, parsed.partnerId);
        }
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to claim match' });
      }
    });

    socket.on('game:catchPlayer', (payload: CatchPlayerPayload) => {
      try {
        const parsed = CatchPlayerPayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const game = activeGames.get(result.room.code);
        if (game) {
          game.handleCatchPlayer(result.player.id, parsed.targetPlayerId);
        }
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to catch player' });
      }
    });

    socket.on('game:nextRound', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;

      // Go back to mode select for next round
      room.phase = GamePhase.MODE_SELECT;
      io.to(room.code).emit('game:phaseChange', { phase: GamePhase.MODE_SELECT });
      io.to(room.code).emit('room:updated', { room: room.toState() });
    });

    socket.on('game:end', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;

      // Clean up game
      const game = activeGames.get(room.code);
      if (game) {
        game.cleanup();
        activeGames.delete(room.code);
      }

      room.phase = GamePhase.LOBBY;
      room.currentMode = null;
      room.roundNumber = 0;

      io.to(room.code).emit('game:ended', {
        finalScores: Object.fromEntries(room.scores),
      });
      io.to(room.code).emit('room:updated', { room: room.toState() });
    });

    // ─── Disconnect ────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const result = roomManager.handleDisconnect(socket.id);
      if (result) {
        const { room } = result;
        io.to(room.code).emit('room:updated', { room: room.toState() });
      }
    });
  });
}
