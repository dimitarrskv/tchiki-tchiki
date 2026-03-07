import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useSpotify } from './SpotifyContext';
import type { RoomState, PlayerInfo, GameMode, GamePhase } from 'shared/src/types';

interface GameContextValue {
  room: RoomState | null;
  playerId: string | null;
  isHost: boolean;
  error: string | null;
  createRoom: (playerName: string) => void;
  joinRoom: (code: string, playerName: string) => void;
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

  const isHost = room?.hostId === playerId;

  // ─── Socket Event Listeners ────────────────────────────

  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ code, room }) => {
      setRoom(room);
      // The first player (host) is always at index 0
      setPlayerId(room.players[0]?.id ?? null);
      setError(null);
    });

    socket.on('room:joined', ({ room }) => {
      setRoom(room);
      // The joining player is the last one in the list
      const me = room.players[room.players.length - 1];
      setPlayerId(me?.id ?? null);
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

    socket.on('room:updated', ({ room }) => {
      setRoom(room);
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    socket.on('game:phaseChange', ({ phase }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, phase };
      });
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
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
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

  const joinRoom = useCallback((code: string, playerName: string) => {
    socket?.emit('room:join', { code: code.toUpperCase(), playerName });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket?.emit('room:leave');
    setRoom(null);
    setPlayerId(null);
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
