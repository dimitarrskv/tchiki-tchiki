import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useSpotify } from './SpotifyContext';
import { saveSession, clearSession } from '../lib/sessionStorage';
import type { RoomState, PlayerInfo, GameMode, GamePhase } from 'shared/src/types';

interface GameContextValue {
  room: RoomState | null;
  playerId: string | null;
  isHost: boolean;
  error: string | null;
  phaseData: any;
  createRoom: (playerName: string) => void;
  joinRoom: (code: string, playerName: string, isGuest?: boolean) => void;
  leaveRoom: () => void;
  startGame: () => void;
  selectMode: (mode: GameMode) => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue>({
  room: null,
  playerId: null,
  isHost: false,
  error: null,
  phaseData: null,
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  startGame: () => {},
  selectMode: () => {},
  clearError: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { play, pause } = useSpotify();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseData, setPhaseData] = useState<any>(null);

  const isHost = room?.hostId === playerId;

  // ─── Socket Event Listeners ────────────────────────────

  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ code, room }) => {
      setRoom(room);
      // The first player (host) is always at index 0
      const newPlayerId = room.players[0]?.id ?? null;
      setPlayerId(newPlayerId);
      setError(null);

      // Save session for reconnection
      if (newPlayerId) {
        saveSession({
          roomCode: code,
          playerId: newPlayerId,
          playerName: room.players[0]?.name ?? '',
          isHost: true,
        });
      }
    });

    socket.on('room:joined', ({ playerId, room }) => {
      setRoom(room);
      setPlayerId(playerId);
      setError(null);

      // Save session for reconnection
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        saveSession({
          roomCode: room.code,
          playerId: playerId,
          playerName: player.name,
          isHost: player.isHost,
        });
      }
    });

    socket.on('room:rejoined', ({ playerId, room }) => {
      console.log('Successfully rejoined room');
      setRoom(room);
      setPlayerId(playerId);
      setError(null);
    });

    socket.on('room:playerJoined', ({ player }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, player],
        };
      });
    });

    socket.on('room:playerLeft', ({ playerId: leftId }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== leftId),
        };
      });
    });

    socket.on('room:playerReconnected', ({ playerId: reconnectedId }) => {
      console.log(`Player ${reconnectedId} reconnected`);
      // Room state will be updated via room:updated event
    });

    socket.on('room:updated', ({ room }) => {
      setRoom(room);
    });

    socket.on('room:error', ({ message }) => {
      // If rejoin failed due to expired session, clear it automatically
      if (message.includes('Could not rejoin') || message.includes('Session may have expired')) {
        clearSession();
      }
      setError(message);
    });

    socket.on('game:phaseChange', ({ phase, data }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, phase };
      });
      setPhaseData(data || null);
    });

    socket.on('game:modeSelected', ({ mode }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, currentMode: mode };
      });
    });

    socket.on('game:scores', ({ scores }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, scores };
      });
    });

    socket.on('game:ended', () => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, phase: 'lobby' as GamePhase, currentMode: null };
      });
    });

    // Music playback events
    socket.on('game:play', ({ trackUri }: { trackUri: string }) => {
      console.log('Playing track:', trackUri);
      play(trackUri).catch(err => {
        console.error('Failed to play track:', err);
        setError('Failed to play music. Make sure Spotify is connected.');
      });
    });

    socket.on('game:silence', () => {
      console.log('Silence for faker');
      // Faker gets silence - optionally pause or do nothing
      pause().catch(err => console.error('Failed to pause:', err));
    });

    socket.on('game:stop', () => {
      console.log('Stopping music');
      pause().catch(err => console.error('Failed to stop:', err));
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:rejoined');
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:playerReconnected');
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('game:phaseChange');
      socket.off('game:modeSelected');
      socket.off('game:scores');
      socket.off('game:ended');
      socket.off('game:play');
      socket.off('game:silence');
      socket.off('game:stop');
    };
  }, [socket, play, pause]);

  // ─── Actions ───────────────────────────────────────────

  const createRoom = useCallback((playerName: string) => {
    socket?.emit('room:create', { playerName });
  }, [socket]);

  const joinRoom = useCallback((code: string, playerName: string, isGuest: boolean = false) => {
    socket?.emit('room:join', { code: code.toUpperCase(), playerName, isGuest });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket?.emit('room:leave');
    setRoom(null);
    setPlayerId(null);
    clearSession(); // Clear saved session
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('game:start');
  }, [socket]);

  const selectMode = useCallback((mode: GameMode) => {
    socket?.emit('game:select', { mode });
  }, [socket]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        room,
        playerId,
        isHost,
        error,
        phaseData,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        selectMode,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  return useContext(GameContext);
}
