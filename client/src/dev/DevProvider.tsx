import { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { SocketContext } from '../context/SocketContext';
import { GameContext } from '../context/GameContext';
import { GamePhase } from 'shared/src/types';
import type { RoomState, PairResult } from 'shared/src/types';
import { generateRoom, generatePairResults, generatePhaseData } from './mockData';

// ─── Dev Controls Context (shared between DevProvider ↔ DevPanel) ────

export interface DevState {
  phase: GamePhase;
  playerCount: number;
  isHost: boolean;
  roundNumber: number;
  roundLimit: number;
}

interface DevControlsValue {
  state: DevState;
  setPhase: (phase: GamePhase) => void;
  setPlayerCount: (count: number) => void;
  setIsHost: (isHost: boolean) => void;
  setRoundNumber: (n: number) => void;
  setRoundLimit: (n: number) => void;
}

const DevControlsContext = createContext<DevControlsValue>(null!);
export const useDevControls = () => useContext(DevControlsContext);

// ─── Stub socket (no-op for .on/.off/.emit) ─────────────────────────

const stubSocket = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'on' || prop === 'off' || prop === 'emit') {
      return () => {};
    }
    if (prop === 'connected') return true;
    if (prop === 'id') return 'dev-socket';
    if (prop === 'io') {
      return new Proxy({} as any, {
        get() { return () => {}; },
      });
    }
    return undefined;
  },
});

// ─── Provider ────────────────────────────────────────────────────────

export function DevProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [playerCount, setPlayerCount] = useState(6);
  const [isHostView, setIsHostView] = useState(true);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundLimit, setRoundLimit] = useState(5);

  // Derive room + pair results from dev state
  const room: RoomState = useMemo(
    () => generateRoom(phase, playerCount, roundNumber, roundLimit),
    [phase, playerCount, roundNumber, roundLimit],
  );

  const playerId = isHostView ? room.players[0]?.id ?? null : room.players[1]?.id ?? null;
  const isHost = isHostView;

  const pairResults: PairResult | null = useMemo(() => {
    if (phase === GamePhase.REVEAL || phase === GamePhase.RESULTS) {
      return generatePairResults(room.players);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerCount]);

  const phaseData = useMemo(() => generatePhaseData(phase), [phase]);

  // No-op action functions
  const noop = useCallback(() => {}, []);

  // ─── Context values ──────────────────────────────────────

  const socketValue = useMemo(() => ({
    socket: stubSocket,
    isConnected: true,
    connectionState: 'connected' as const,
    isRejoining: false,
  }), []);

  const gameValue = useMemo(() => ({
    room,
    playerId,
    isHost,
    error: null,
    phaseData,
    pairResults,
    currentTrackUri: null,
    currentTrackMeta: null,
    createRoom: noop,
    joinRoom: noop as any,
    leaveRoom: noop,
    startGame: noop,
    nextRound: noop,
    endGame: noop,
    returnToLobby: noop,
    setRoundLimit: noop as any,
    clearError: noop,
  }), [room, playerId, isHost, phaseData, pairResults, noop]);

  const devControls: DevControlsValue = useMemo(() => ({
    state: { phase, playerCount, isHost: isHostView, roundNumber, roundLimit },
    setPhase,
    setPlayerCount,
    setIsHost: setIsHostView,
    setRoundNumber,
    setRoundLimit,
  }), [phase, playerCount, isHostView, roundNumber, roundLimit]);

  return (
    <DevControlsContext.Provider value={devControls}>
      <SocketContext.Provider value={socketValue}>
        <GameContext.Provider value={gameValue}>
          {children}
        </GameContext.Provider>
      </SocketContext.Provider>
    </DevControlsContext.Provider>
  );
}
