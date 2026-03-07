import { z } from 'zod';

// ─── Game Phases ─────────────────────────────────────────────

export enum GamePhase {
  LOBBY = 'lobby',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  REVEAL = 'reveal',
  RESULTS = 'results',
}

export enum GameMode {
  MUSIC_PAIRS = 'music-pairs',
}

// ─── Data Structures ─────────────────────────────────────────

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: PlayerInfo[];
  phase: GamePhase;
  currentMode: GameMode | null;
  roundNumber: number;
  scores: Record<string, number>;
}

export interface RoundData {
  // Music Pairs
  pairs?: [string, string][];
  matchedPairs?: [string, string][];
  claims?: Record<string, string>; // claimerId -> partnerId

  // Common
  trackUri?: string;
  listenDuration?: number;
}

export interface PairResult {
  pairs: [string, string][];
  matchedCorrectly: [string, string][];
}

// ─── Socket Event Payloads ───────────────────────────────────

// Client → Server
export const CreateRoomPayload = z.object({
  playerName: z.string().min(1).max(20),
});
export type CreateRoomPayload = z.infer<typeof CreateRoomPayload>;

export const JoinRoomPayload = z.object({
  code: z.string().length(4),
  playerName: z.string().min(1).max(20),
  isGuest: z.boolean().optional(),
});
export type JoinRoomPayload = z.infer<typeof JoinRoomPayload>;

export const RejoinRoomPayload = z.object({
  code: z.string().length(4),
  playerId: z.string(),
  playerName: z.string().min(1).max(20),
});
export type RejoinRoomPayload = z.infer<typeof RejoinRoomPayload>;

export const PlayerReadyPayload = z.object({
  spotifyDeviceId: z.string().optional(),
});
export type PlayerReadyPayload = z.infer<typeof PlayerReadyPayload>;

export const ClaimMatchPayload = z.object({
  partnerId: z.string(),
});
export type ClaimMatchPayload = z.infer<typeof ClaimMatchPayload>;

// ─── Socket Event Maps (for type-safe socket.io) ────────────

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload) => void;
  'room:join': (payload: JoinRoomPayload) => void;
  'room:rejoin': (payload: RejoinRoomPayload) => void;
  'room:leave': () => void;
  'player:ready': (payload: PlayerReadyPayload) => void;
  'game:start': () => void;
  'game:claimMatch': (payload: ClaimMatchPayload) => void;
  'game:nextRound': () => void;
  'game:end': () => void;
}

export interface ServerToClientEvents {
  'room:created': (payload: { code: string; room: RoomState }) => void;
  'room:joined': (payload: { playerId: string; room: RoomState }) => void;
  'room:rejoined': (payload: { playerId: string; room: RoomState }) => void;
  'room:playerJoined': (payload: { player: PlayerInfo }) => void;
  'room:playerLeft': (payload: { playerId: string }) => void;
  'room:playerReconnected': (payload: { playerId: string }) => void;
  'room:error': (payload: { message: string }) => void;
  'room:updated': (payload: { room: RoomState }) => void;
  'game:countdown': (payload: { count: number }) => void;
  'game:play': (payload: { trackUri: string; serverTimestamp: number }) => void;
  'game:stop': () => void;
  'game:phaseChange': (payload: { phase: GamePhase; data?: any }) => void;
  'game:pairResults': (payload: PairResult) => void;
  'game:scores': (payload: { scores: Record<string, number> }) => void;
  'game:ended': (payload: { finalScores: Record<string, number> }) => void;
}
