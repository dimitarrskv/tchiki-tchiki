import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  RejoinRoomPayload,
  PlayerReadyPayload,
  ClaimMatchPayload,
  GamePhase,
  GameMode,
} from 'shared';
import { RoomManager } from '../rooms/RoomManager';
import { BaseGame } from '../games/BaseGame';
import { MusicPairs } from '../games/MusicPairs';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Active games per room
const activeGames = new Map<string, BaseGame>();

function endGame(io: TypedServer, room: any): void {
  const game = activeGames.get(room.code);
  if (game) {
    game.cleanup();
    activeGames.delete(room.code);
  }

  room.phase = GamePhase.GAME_OVER;
  room.currentMode = null;

  io.to(room.code).emit('game:ended', {
    finalScores: Object.fromEntries(room.scores),
  });
  io.to(room.code).emit('room:updated', { room: room.toState() });
}

function startNewRound(io: TypedServer, room: any): void {
  // Check if round limit reached
  if (room.roundNumber >= room.roundLimit) {
    endGame(io, room);
    return;
  }

  const prevGame = activeGames.get(room.code);
  if (prevGame) {
    prevGame.cleanup();
  }

  const game = new MusicPairs(io, room);
  game.onNextRound = () => startNewRound(io, room);
  activeGames.set(room.code, game);
  game.start();
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
        const { room, player } = roomManager.joinRoom(
          parsed.code,
          socket.id,
          parsed.playerName
        );

        socket.join(room.code);
        socket.emit('room:joined', { playerId: player.id, room: room.toState() });
        socket.to(room.code).emit('room:playerJoined', { player: player.toInfo() });
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to join room' });
      }
    });

    socket.on('room:rejoin', (payload: RejoinRoomPayload) => {
      try {
        const parsed = RejoinRoomPayload.parse(payload);
        const result = roomManager.handleReconnect(
          socket.id,
          parsed.playerId,
          parsed.code.toUpperCase()
        );

        if (!result) {
          socket.emit('room:error', { message: 'Could not rejoin room. Session may have expired.' });
          return;
        }

        const { room, player } = result;
        socket.join(room.code);
        socket.emit('room:rejoined', { playerId: player.id, room: room.toState() });
        socket.to(room.code).emit('room:playerReconnected', { playerId: player.id });
        io.to(room.code).emit('room:updated', { room: room.toState() });

        console.log(`${player.name} rejoined room ${room.code}`);
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Failed to rejoin room' });
      }
    });

    socket.on('room:leave', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      const wasHost = player.isHost;
      const wasInGame = room.phase !== GamePhase.LOBBY && room.phase !== GamePhase.GAME_OVER;

      room.removePlayer(player.id);
      socket.leave(room.code);

      io.to(room.code).emit('room:playerLeft', { playerId: player.id });

      if (room.isEmpty()) {
        // Clean up game if room is empty
        const game = activeGames.get(room.code);
        if (game) {
          game.cleanup();
          activeGames.delete(room.code);
        }
      } else if (wasHost) {
        // Host left — end the game and boot everyone back to home
        const game = activeGames.get(room.code);
        if (game) {
          game.cleanup();
          activeGames.delete(room.code);
        }
        io.to(room.code).emit('room:error', { message: 'Host has left the game' });
        io.to(room.code).emit('room:disbanded');
      } else if (wasInGame && room.connectedPlayerCount < 2) {
        // Not enough players to continue — end the game
        endGame(io, room);
      } else {
        io.to(room.code).emit('room:updated', { room: room.toState() });
      }
    });

    // ─── Player Events ─────────────────────────────────────

    socket.on('player:ready', (payload: PlayerReadyPayload) => {
      try {
        PlayerReadyPayload.parse(payload);
        const result = roomManager.getPlayerBySocketId(socket.id);
        if (!result) return;

        const { room, player } = result;
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

      // Set the mode to Music Pairs (only mode available)
      room.currentMode = GameMode.MUSIC_PAIRS;

      // Reset scores if starting from lobby (new game)
      if (room.phase === GamePhase.LOBBY) {
        room.scores.clear();
      }

      startNewRound(io, room);
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

    socket.on('game:nextRound', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;

      startNewRound(io, room);
    });

    socket.on('game:end', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;

      endGame(io, room);
    });

    socket.on('room:setRoundLimit', (payload: { roundLimit: number }) => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;
      if (room.phase !== GamePhase.LOBBY) return;

      const limit = payload.roundLimit;
      if (![5, 10, 15].includes(limit)) return;

      room.roundLimit = limit;
      io.to(room.code).emit('room:updated', { room: room.toState() });
    });

    socket.on('game:returnToLobby', () => {
      const result = roomManager.getPlayerBySocketId(socket.id);
      if (!result) return;

      const { room, player } = result;
      if (!player.isHost) return;

      // Return to lobby and reset scores
      room.phase = GamePhase.LOBBY;
      room.roundNumber = 0;
      room.scores.clear();

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
