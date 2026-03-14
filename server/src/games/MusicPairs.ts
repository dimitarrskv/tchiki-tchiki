import { BaseGame, TypedServer } from './BaseGame';
import { Room } from '../rooms/Room';
import { GamePhase } from 'shared';
import { getUniqueRandomTrackData, TrackData } from '../spotify/tracks';
import { fetchPreviewsForTracks } from '../spotify/api';

interface MusicPairsState {
  pairs: [string, string][]; // Actual pairs [playerId1, playerId2]
  claims: Map<string, string>; // playerId -> partnerId they claimed
  trackData: TrackData[]; // One track per pair (with metadata)
  previewUrls: Map<string, string>; // trackId -> previewUrl (fetched at runtime)
  albumArts: Map<string, string>; // trackId -> albumArt URL (fetched at runtime)
}

export class MusicPairs extends BaseGame {
  private state: MusicPairsState | null = null;

  constructor(io: TypedServer, room: Room) {
    super(io, room);
  }

  start(): void {
    const players = this.getConnectedPlayers();
    if (players.length < 4) {
      this.emit('room:error', { message: 'Need at least 4 players' });
      return;
    }

    // Shuffle and create pairs
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const pairs: [string, string][] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i].id, shuffled[i + 1].id]);
    }

    // Handle odd player
    if (shuffled.length % 2 === 1) {
      const lastPlayer = shuffled[shuffled.length - 1];
      pairs.push([lastPlayer.id, lastPlayer.id]);
    }

    const trackData = getUniqueRandomTrackData(pairs.length);
    this.state = {
      pairs,
      claims: new Map(),
      trackData,
      previewUrls: new Map(),
      albumArts: new Map(),
    };

    this.room.roundNumber++;
    this.setPhase(GamePhase.COUNTDOWN);

    // Send countdown updates (3, 2, 1)
    for (let i = 3; i > 0; i--) {
      setTimeout(() => {
        this.emit('game:countdown', { count: i });
      }, (3 - i) * 1000);
    }

    // Fetch preview data during countdown, then start playing
    // Wait for BOTH the 3s countdown AND the fetch to complete
    const fetchPromise = this.fetchPreviewData(trackData).catch(err => {
      console.error('Failed to fetch preview data:', err.message);
    });
    const countdownPromise = new Promise(resolve => setTimeout(resolve, 3000));

    Promise.all([fetchPromise, countdownPromise]).then(() => {
      this.startPlaying();
    });
  }

  private async fetchPreviewData(trackData: TrackData[]): Promise<void> {
    if (!this.state) return;

    try {
      const results = await fetchPreviewsForTracks(trackData);

      for (const [id, data] of results) {
        if (data.previewUrl) this.state.previewUrls.set(id, data.previewUrl);
        if (data.albumArt) this.state.albumArts.set(id, data.albumArt);
      }

      console.log(`Fetched preview data: ${this.state.previewUrls.size} preview URLs, ${this.state.albumArts.size} album arts`);
    } catch (err: any) {
      console.error('Preview data fetch failed:', err.message);
    }
  }

  private startPlaying(): void {
    if (!this.state) return;

    const players = this.getConnectedPlayers();
    console.log(`Starting playing phase with ${players.length} connected players`);

    const serverTimestamp = Date.now();

    for (const player of players) {
      const pairIndex = this.state.pairs.findIndex(
        pair => pair[0] === player.id || pair[1] === player.id
      );

      if (pairIndex >= 0) {
        const td = this.state.trackData[pairIndex];
        const trackId = td.uri.replace('spotify:track:', '');

        const payload = {
          trackUri: td.uri,
          serverTimestamp,
          trackName: td.name,
          trackArtist: td.artist,
          previewUrl: this.state.previewUrls.get(trackId) || null,
          trackArt: this.state.albumArts.get(trackId) || '',
        };

        console.log(`Sending track to ${player.name}:`, td.name);
        this.emitToPlayer(player.socketId, 'game:play', payload);
      } else {
        console.warn(`Player ${player.name} not found in any pair`);
      }
    }

    this.setPhase(GamePhase.PLAYING, {
      durationMs: this.config.listenDurationMs,
      serverTimestamp: serverTimestamp
    });

    this.scheduleTimeout(() => this.stopAndResolve(), this.config.listenDurationMs);
  }

  private stopAndResolve(): void {
    const players = this.getConnectedPlayers();
    for (const player of players) {
      this.emitToPlayer(player.socketId, 'game:stop');
    }
    this.resolveMatches();
  }

  handleClaimMatch(playerId: string, partnerId: string): void {
    if (!this.state || this.room.phase !== GamePhase.PLAYING) return;

    this.state.claims.set(playerId, partnerId);

    const totalPlayers = this.getConnectedPlayers().length;
    const totalClaims = this.state.claims.size;
    this.emit('game:phaseChange', {
      phase: GamePhase.PLAYING,
      data: {
        durationMs: this.config.listenDurationMs,
        claimsIn: totalClaims,
        totalPlayers
      },
    });
  }

  private resolveMatches(): void {
    if (!this.state) return;

    const matchedCorrectly: [string, string][] = [];
    const correctGuesses = new Set<string>();

    for (const [player1Id, player2Id] of this.state.pairs) {
      if (player1Id === player2Id) continue;

      const player1Claim = this.state.claims.get(player1Id);
      const player1Correct = player1Claim === player2Id;
      const player2Claim = this.state.claims.get(player2Id);
      const player2Correct = player2Claim === player1Id;

      if (player1Correct) correctGuesses.add(player1Id);
      if (player2Correct) correctGuesses.add(player2Id);

      if (player1Correct && player2Correct) {
        matchedCorrectly.push([player1Id, player2Id]);
      }
    }

    for (const playerId of correctGuesses) {
      const current = this.room.scores.get(playerId) || 0;
      this.room.scores.set(playerId, current + 1);
    }

    for (const [player1, player2] of matchedCorrectly) {
      const current1 = this.room.scores.get(player1) || 0;
      this.room.scores.set(player1, current1 + 1);
      const current2 = this.room.scores.get(player2) || 0;
      this.room.scores.set(player2, current2 + 1);
    }

    this.setPhase(GamePhase.REVEAL);

    const trackMeta = this.state.trackData.map(td => {
      const trackId = td.uri.replace('spotify:track:', '');
      return {
        name: td.name,
        artist: td.artist,
        imageUrl: this.state!.albumArts.get(trackId) || '',
      };
    });

    this.emit('game:pairResults', {
      pairs: this.state.pairs,
      matchedCorrectly,
      correctGuesses: Array.from(correctGuesses),
      trackUris: this.state.trackData.map(t => t.uri),
      trackMeta,
    });

    this.emit('game:scores', {
      scores: Object.fromEntries(this.room.scores),
    });

    this.scheduleTimeout(() => {
      this.setPhase(GamePhase.RESULTS, { autoAdvanceMs: 8000 });

      // Auto-advance to next round
      this.scheduleTimeout(() => {
        if (this.room.phase === GamePhase.RESULTS && this.onNextRound) {
          this.onNextRound();
        }
      }, 8000);
    }, 5000);
  }

}
