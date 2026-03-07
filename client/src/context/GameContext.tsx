import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useSpotify } from './SpotifyContext';
import { saveSession, clearSession } from '../lib/sessionStorage';
import type { RoomState, PlayerInfo, GamePhase, PairResult } from 'shared/src/types';

interface GameContextValue {
  room: RoomState | null;
  playerId: string | null;
  isHost: boolean;
  error: string | null;
  phaseData: any;
  pairResults: PairResult | null;
  createRoom: (playerName: string) => void;
  joinRoom: (code: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  nextRound: () => void;
  endGame: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue>({
  room: null,
  playerId: null,
  isHost: false,
  error: null,
  phaseData: null,
  pairResults: null,
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  startGame: () => {},
  nextRound: () => {},
  endGame: () => {},
  clearError: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { play, pause, syncPlayback } = useSpotify();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseData, setPhaseData] = useState<any>(null);
  const [pairResults, setPairResults] = useState<PairResult | null>(null);

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
    socket.on('game:play', async ({ trackUri, serverTimestamp }: { trackUri: string; serverTimestamp: number }) => {
      console.log('🎵 Received play command:', {
        trackUri,
        serverTimestamp,
        receivedAt: Date.now(),
        delay: Date.now() - serverTimestamp
      });

      try {
        // Start playback
        console.log('🎵 Starting playback...');
        await play(trackUri);
        console.log('🎵 Playback started successfully');

        // Wait for playback to actually start (give it 500ms)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Calculate how much time has elapsed since server sent the command
        const elapsedMs = Date.now() - serverTimestamp;
        console.log('🎵 Elapsed time since server sent command:', elapsedMs, 'ms');

        // Sync to correct position (accounting for network/processing delay)
        if (elapsedMs > 100) {  // Only sync if delay is significant
          console.log('🎵 Syncing playback to position:', elapsedMs, 'ms');
          await syncPlayback(elapsedMs);
          console.log('🎵 Playback synced');
        }
      } catch (err: any) {
        console.error('❌ Failed to play track:', err);
        console.error('❌ Error details:', {
          message: err?.message,
          stack: err?.stack,
          name: err?.name
        });
        setError(`Failed to play music: ${err?.message || 'Unknown error'}. Make sure Spotify is connected.`);
      }
    });

    socket.on('game:stop', () => {
      console.log('Stopping music');
      pause().catch(err => console.error('Failed to stop:', err));
    });

    socket.on('game:pairResults', (results: PairResult) => {
      console.log('Received pair results:', results);
      setPairResults(results);
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
      socket.off('game:scores');
      socket.off('game:ended');
      socket.off('game:play');
      socket.off('game:stop');
      socket.off('game:pairResults');
    };
  }, [socket, play, pause, syncPlayback]);

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
    clearSession(); // Clear saved session
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('game:start');
  }, [socket]);

  const nextRound = useCallback(() => {
    socket?.emit('game:nextRound');
    setPairResults(null); // Clear previous results
  }, [socket]);

  const endGame = useCallback(() => {
    socket?.emit('game:end');
    setPairResults(null); // Clear results
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
        pairResults,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        nextRound,
        endGame,
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
