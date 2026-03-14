import { GamePhase, GameMode } from 'shared/src/types';
import type { PlayerInfo, RoomState, PairResult, TrackMeta } from 'shared/src/types';

const NAMES = [
  'Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Quinn',
  'Avery', 'Charlie', 'Skyler', 'Reese', 'Dakota', 'Finley', 'Rowan', 'Ellis',
  'Sage', 'Phoenix', 'River', 'Lennox',
];

const TRACKS: TrackMeta[] = [
  { name: 'Blinding Lights', artist: 'The Weeknd', imageUrl: 'https://placehold.co/80x80/1a1a2e/00f0ff?text=BL' },
  { name: 'Levitating', artist: 'Dua Lipa', imageUrl: 'https://placehold.co/80x80/1a1a2e/ff6b9d?text=LV' },
  { name: 'Stay', artist: 'Kid LAROI & Justin Bieber', imageUrl: 'https://placehold.co/80x80/1a1a2e/39ff14?text=ST' },
  { name: 'Heat Waves', artist: 'Glass Animals', imageUrl: 'https://placehold.co/80x80/1a1a2e/ffc107?text=HW' },
  { name: 'Good 4 U', artist: 'Olivia Rodrigo', imageUrl: 'https://placehold.co/80x80/1a1a2e/e040fb?text=G4' },
  { name: 'Peaches', artist: 'Justin Bieber', imageUrl: 'https://placehold.co/80x80/1a1a2e/ff5757?text=PC' },
  { name: 'Montero', artist: 'Lil Nas X', imageUrl: 'https://placehold.co/80x80/1a1a2e/00f0ff?text=MT' },
  { name: 'Kiss Me More', artist: 'Doja Cat ft. SZA', imageUrl: 'https://placehold.co/80x80/1a1a2e/ff6b9d?text=KM' },
  { name: 'Save Your Tears', artist: 'The Weeknd', imageUrl: 'https://placehold.co/80x80/1a1a2e/39ff14?text=SY' },
  { name: 'Drivers License', artist: 'Olivia Rodrigo', imageUrl: 'https://placehold.co/80x80/1a1a2e/ffc107?text=DL' },
];

export function generatePlayers(count: number): PlayerInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `dev-player-${i}`,
    name: NAMES[i % NAMES.length],
    isHost: i === 0,
    isReady: true,
    isConnected: i < count - 1 || count <= 3, // last player disconnected if 4+
  }));
}

export function generateScores(players: PlayerInfo[], round: number): Record<string, number> {
  const scores: Record<string, number> = {};
  players.forEach((p, i) => {
    // Give varied scores — first player scores highest
    scores[p.id] = Math.max(0, (players.length - i) * round + Math.floor(Math.random() * 3));
  });
  return scores;
}

export function generatePairResults(players: PlayerInfo[]): PairResult {
  const pairs: [string, string][] = [];
  const matchedCorrectly: [string, string][] = [];
  const correctGuesses: string[] = [];
  const trackUris: string[] = [];
  const trackMeta: TrackMeta[] = [];

  // Pair players up
  for (let i = 0; i < players.length - 1; i += 2) {
    const pair: [string, string] = [players[i].id, players[i + 1].id];
    pairs.push(pair);

    const track = TRACKS[Math.floor(i / 2) % TRACKS.length];
    trackUris.push(`mock:track:${i}`);
    trackMeta.push(track);

    // ~50% chance of perfect match, ~25% partial, ~25% miss
    const roll = Math.random();
    if (roll < 0.5) {
      matchedCorrectly.push(pair);
      correctGuesses.push(pair[0], pair[1]);
    } else if (roll < 0.75) {
      correctGuesses.push(pair[0]); // partial — only one guessed right
    }
  }

  // Odd player out → solo
  if (players.length % 2 === 1) {
    const lastId = players[players.length - 1].id;
    pairs.push([lastId, lastId]);
    trackUris.push(`mock:track:solo`);
    trackMeta.push(TRACKS[TRACKS.length - 1]);
  }

  return { pairs, matchedCorrectly, correctGuesses, trackUris, trackMeta };
}

export function generatePhaseData(phase: GamePhase): any {
  switch (phase) {
    case GamePhase.PLAYING:
      return { serverTimestamp: Date.now(), durationMs: 30000 };
    case GamePhase.REVEAL:
      return { autoAdvanceMs: 5000 };
    case GamePhase.RESULTS:
      return { autoAdvanceMs: 8000 };
    default:
      return null;
  }
}

export function generateRoom(
  phase: GamePhase,
  playerCount: number,
  roundNumber: number,
  roundLimit: number,
): RoomState {
  const players = generatePlayers(playerCount);
  const scores = phase === GamePhase.LOBBY
    ? Object.fromEntries(players.map(p => [p.id, 0]))
    : generateScores(players, roundNumber);

  return {
    code: 'DEV1',
    hostId: players[0].id,
    players,
    phase,
    currentMode: GameMode.MUSIC_PAIRS,
    roundNumber,
    roundLimit,
    scores,
  };
}
