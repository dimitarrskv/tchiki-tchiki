import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { saveSession, clearSession } from '../lib/sessionStorage';
import type { RoomState, GamePhase, PairResult, TrackMeta } from 'shared/src/types';

interface GameContextValue {
  room: RoomState | null;
  playerId: string | null;
  isHost: boolean;
  error: string | null;
  phaseData: any;
  pairResults: PairResult | null;
  currentTrackUri: string | null;
  currentTrackMeta: TrackMeta | null;
  createRoom: (playerName: string) => void;
  joinRoom: (code: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  nextRound: () => void;
  endGame: () => void;
  returnToLobby: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue>({
  room: null,
  playerId: null,
  isHost: false,
  error: null,
  phaseData: null,
  pairResults: null,
  currentTrackUri: null,
  currentTrackMeta: null,
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  startGame: () => {},
  nextRound: () => {},
  endGame: () => {},
  returnToLobby: () => {},
  clearError: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseData, setPhaseData] = useState<any>(null);
  const [pairResults, setPairResults] = useState<PairResult | null>(null);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);
  const [currentTrackMeta, setCurrentTrackMeta] = useState<TrackMeta | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isHost = room?.hostId === playerId;

  // ─── Socket Event Listeners ────────────────────────────

  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ code, room }) => {
      setRoom(room);
      const newPlayerId = room.players[0]?.id ?? null;
      setPlayerId(newPlayerId);
      setError(null);

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
    });

    socket.on('room:updated', ({ room }) => {
      setRoom(room);
    });

    socket.on('room:error', ({ message }) => {
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

    // Music playback via HTML5 Audio
    socket.on('game:play', async ({ trackUri, serverTimestamp, previewUrl, trackName, trackArtist, trackArt }) => {
      console.log('Received play command:', { trackUri, previewUrl: !!previewUrl });

      setCurrentTrackUri(trackUri);
      setCurrentTrackMeta({ name: trackName, artist: trackArtist || '', imageUrl: trackArt || '' });

      try {
        if (!previewUrl) {
          setError('Preview URL unavailable for this track');
          return;
        }
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          previewAudioRef.current = null;
        }
        const audio = new Audio(previewUrl);
        audio.volume = 0.8;
        previewAudioRef.current = audio;
        await audio.play();

        // Sync position if needed
        const elapsedMs = Date.now() - serverTimestamp;
        if (elapsedMs > 500) {
          audio.currentTime = elapsedMs / 1000;
        }
      } catch (err: any) {
        console.error('Failed to play track:', err);
        setError(`Failed to play music: ${err?.message || 'Unknown error'}`);
      }
    });

    socket.on('game:stop', () => {
      console.log('Stopping music');
      setCurrentTrackUri(null);
      setCurrentTrackMeta(null);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

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
    clearSession();
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('game:start');
  }, [socket]);

  const nextRound = useCallback(() => {
    socket?.emit('game:nextRound');
    setPairResults(null);
  }, [socket]);

  const endGame = useCallback(() => {
    socket?.emit('game:end');
    setPairResults(null);
  }, [socket]);

  const returnToLobby = useCallback(() => {
    socket?.emit('game:returnToLobby');
    setPairResults(null);
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
        currentTrackUri,
        currentTrackMeta,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        nextRound,
        endGame,
        returnToLobby,
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
