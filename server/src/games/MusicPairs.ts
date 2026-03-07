import { BaseGame, TypedServer, GameConfig } from './BaseGame';
import { Room } from '../rooms/Room';
import { GamePhase } from 'shared/src/types';
import { getRandomTrack } from '../spotify/tracks';

interface MusicPairsState {
  pairs: [string, string][]; // Actual pairs [playerId1, playerId2]
  claims: Map<string, string>; // playerId -> partnerId they claimed
  trackUris: string[]; // One track per pair
}

export class MusicPairs extends BaseGame {
  private state: MusicPairsState | null = null;

  constructor(io: TypedServer, room: Room, config?: Partial<GameConfig>) {
    super(io, room, config);
  }

  start(): void {
    const players = this.getConnectedPlayers();
    if (players.length < 2) {
      this.emit('room:error', { message: 'Need at least 2 players' });
      return;
    }

    // Shuffle and create pairs
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const pairs: [string, string][] = [];

    // If odd number of players, last one gets paired with themselves (hears unique song)
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i].id, shuffled[i + 1].id]);
    }

    // Handle odd player
    if (shuffled.length % 2 === 1) {
      const lastPlayer = shuffled[shuffled.length - 1];
      pairs.push([lastPlayer.id, lastPlayer.id]); // Solo player
    }

    // Get unique tracks for each pair
    const trackUris = pairs.map(() => getRandomTrack());

    this.state = {
      pairs,
      claims: new Map(),
      trackUris,
    };

    this.room.roundNumber++;

    // Countdown phase
    this.setPhase(GamePhase.COUNTDOWN);

    // Send countdown updates (3, 2, 1)
    for (let i = 3; i > 0; i--) {
      setTimeout(() => {
        this.emit('game:countdown', { count: i });
      }, (3 - i) * 1000);
    }

    // After countdown, start playing
    this.scheduleTimeout(() => this.startPlaying(), 3000);
  }

  private startPlaying(): void {
    if (!this.state) return;

    const players = this.getConnectedPlayers();

    // Send play events to all players with Spotify devices
    const authenticatedPlayers = players.filter(p => p.spotifyDeviceId);

    const serverTimestamp = Date.now(); // Capture timestamp for sync

    // Send the appropriate track to each player based on their pair
    for (const player of authenticatedPlayers) {
      const pairIndex = this.state.pairs.findIndex(
        pair => pair[0] === player.id || pair[1] === player.id
      );

      if (pairIndex >= 0) {
        const trackUri = this.state.trackUris[pairIndex];
        this.emitToPlayer(player.socketId, 'game:play', { trackUri, serverTimestamp });
      }
    }

    this.setPhase(GamePhase.PLAYING);

    // Send duration info so clients can show timer
    this.emit('game:phaseChange', {
      phase: GamePhase.PLAYING,
      data: { durationMs: this.config.listenDurationMs }
    });

    // After listen duration, stop music and resolve matches
    this.scheduleTimeout(() => this.stopAndResolve(), this.config.listenDurationMs);
  }

  private stopAndResolve(): void {
    // Stop music for all players with Spotify devices
    const players = this.getConnectedPlayers();
    const authenticatedPlayers = players.filter(p => p.spotifyDeviceId);

    for (const player of authenticatedPlayers) {
      this.emitToPlayer(player.socketId, 'game:stop');
    }

    // Go directly to resolving matches
    this.resolveMatches();
  }

  handleClaimMatch(playerId: string, partnerId: string): void {
    if (!this.state || this.room.phase !== GamePhase.PLAYING) return;

    // Record the claim (allow updating selection)
    this.state.claims.set(playerId, partnerId);

    // Broadcast claim count (not who claimed whom) to show progress
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

    // Check which claims were correct
    const matchedCorrectly: [string, string][] = [];

    for (const [playerId, claimedPartnerId] of this.state.claims.entries()) {
      // Find the actual pair for this player
      const actualPair = this.state.pairs.find(
        pair => pair[0] === playerId || pair[1] === playerId
      );

      if (!actualPair) continue;

      // Check if they claimed the correct partner
      const correctPartner = actualPair[0] === playerId ? actualPair[1] : actualPair[0];

      if (claimedPartnerId === correctPartner) {
        // Check if this match hasn't been added yet (both partners matched correctly)
        const alreadyAdded = matchedCorrectly.some(
          match => (match[0] === playerId && match[1] === correctPartner) ||
                   (match[1] === playerId && match[0] === correctPartner)
        );

        if (!alreadyAdded) {
          matchedCorrectly.push([playerId, correctPartner]);
        }
      }
    }

    // Scoring: Each player in a correctly matched pair gets 2 points
    for (const [player1, player2] of matchedCorrectly) {
      // Award points to both players in the matched pair
      const current1 = this.room.scores.get(player1) || 0;
      this.room.scores.set(player1, current1 + 2);

      if (player1 !== player2) { // Don't double-award if solo player
        const current2 = this.room.scores.get(player2) || 0;
        this.room.scores.set(player2, current2 + 2);
      }
    }

    // Reveal phase
    this.setPhase(GamePhase.REVEAL);

    this.emit('game:pairResults', {
      pairs: this.state.pairs,
      matchedCorrectly,
    });

    this.emit('game:scores', {
      scores: Object.fromEntries(this.room.scores),
    });

    // Move to results after a delay for the reveal animation
    this.scheduleTimeout(() => {
      this.setPhase(GamePhase.RESULTS);
    }, 5000);
  }

}
