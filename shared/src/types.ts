import { z } from 'zod';

// ─── Game Phases ─────────────────────────────────────────────

export enum GamePhase {
  LOBBY = 'lobby',
  MODE_SELECT = 'mode_select',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  VOTING = 'voting',
  MATCHING = 'matching',
  CATCHING = 'catching',
  REVEAL = 'reveal',
  RESULTS = 'results',
  FINAL_SCORES = 'final_scores',
}

export enum GameMode {
  ODD_ONE_OUT = 'odd-one-out',
  MUSIC_PAIRS = 'music-pairs',
  FREEZE = 'freeze',
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
  // Odd One Out
  fakerId?: string;
  votes?: Record<string, string>; // voterId -> targetId

  // Music Pairs
  pairs?: [string, string][];
  matchedPairs?: [string, string][];
  claims?: Record<string, string>; // claimerId -> partnerId

  // Freeze
  frozenPlayers?: string[];
  caughtPlayers?: Record<string, string>; // caughtId -> catcherId

  // Common
  trackUri?: string;
  listenDuration?: number;
  discussionDuration?: number;
  votingDuration?: number;
}

export interface VoteResult {
  votes: Record<string, number>; // playerId -> vote count
  fakerId: string;
  caught: boolean;
}

export interface PairResult {
  pairs: [string, string][];
  matchedCorrectly: [string, string][];
}

export interface FreezeResult {
  catches: Record<string, string>; // caughtId -> catcherId
  survivors: string[];
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
});
export type JoinRoomPayload = z.infer<typeof JoinRoomPayload>;

export const PlayerReadyPayload = z.object({
  spotifyDeviceId: z.string(),
});
export type PlayerReadyPayload = z.infer<typeof PlayerReadyPayload>;

export const GameSelectPayload = z.object({
  mode: z.nativeEnum(GameMode),
});
export type GameSelectPayload = z.infer<typeof GameSelectPayload>;

export const VotePayload = z.object({
  targetPlayerId: z.string(),
});
export type VotePayload = z.infer<typeof VotePayload>;

export const ClaimMatchPayload = z.object({
  partnerId: z.string(),
});
export type ClaimMatchPayload = z.infer<typeof ClaimMatchPayload>;

export const CatchPlayerPayload = z.object({
  targetPlayerId: z.string(),
});
export type CatchPlayerPayload = z.infer<typeof CatchPlayerPayload>;

// ─── Socket Event Maps (for type-safe socket.io) ────────────

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload) => void;
  'room:join': (payload: JoinRoomPayload) => void;
  'room:leave': () => void;
  'player:ready': (payload: PlayerReadyPayload) => void;
  'game:select': (payload: GameSelectPayload) => void;
  'game:start': () => void;
  'game:vote': (payload: VotePayload) => void;
  'game:claimMatch': (payload: ClaimMatchPayload) => void;
  'game:catchPlayer': (payload: CatchPlayerPayload) => void;
  'game:nextRound': () => void;
  'game:end': () => void;
}

export interface ServerToClientEvents {
  'room:created': (payload: { code: string; room: RoomState }) => void;
  'room:joined': (payload: { room: RoomState }) => void;
  'room:playerJoined': (payload: { player: PlayerInfo }) => void;
  'room:playerLeft': (payload: { playerId: string }) => void;
  'room:error': (payload: { message: string }) => void;
  'room:updated': (payload: { room: RoomState }) => void;
  'game:modeSelected': (payload: { mode: GameMode }) => void;
  'game:starting': (payload: { countdown: number }) => void;
  'game:play': (payload: { trackUri: string }) => void;
  'game:silence': () => void;
  'game:stop': () => void;
  'game:phaseChange': (payload: { phase: GamePhase; data?: any }) => void;
  'game:voteResults': (payload: VoteResult) => void;
  'game:pairResults': (payload: PairResult) => void;
  'game:freezeResults': (payload: FreezeResult) => void;
  'game:scores': (payload: { scores: Record<string, number> }) => void;
  'game:ended': (payload: { finalScores: Record<string, number> }) => void;
}
