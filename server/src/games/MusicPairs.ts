import { BaseGame, TypedServer, GameConfig } from './BaseGame';
import { Room } from '../rooms/Room';
import { GamePhase } from 'shared';
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
    console.log(`🎵 Starting playing phase with ${players.length} connected players`);

    // Send play events to all players with Spotify devices
    const authenticatedPlayers = players.filter(p => p.spotifyDeviceId);
    console.log(`🎵 ${authenticatedPlayers.length} players have Spotify devices`);

    const serverTimestamp = Date.now(); // Capture timestamp for sync

    // Send the appropriate track to each player based on their pair
    for (const player of authenticatedPlayers) {
      const pairIndex = this.state.pairs.findIndex(
        pair => pair[0] === player.id || pair[1] === player.id
      );

      if (pairIndex >= 0) {
        const trackUri = this.state.trackUris[pairIndex];
        console.log(`🎵 Sending track to ${player.name} (${player.id}):`, trackUri);
        this.emitToPlayer(player.socketId, 'game:play', { trackUri, serverTimestamp });
      } else {
        console.warn(`⚠️  Player ${player.name} not found in any pair`);
      }
    }

    console.log(`🎵 Setting phase to PLAYING`);
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

    const matchedCorrectly: [string, string][] = [];

    // Check each pair to see if BOTH players correctly identified each other
    for (const [player1Id, player2Id] of this.state.pairs) {
      // Solo player case (odd number of players)
      if (player1Id === player2Id) {
        // Solo players don't need to match, skip scoring
        continue;
      }

      // Check if player1 claimed player2
      const player1Claim = this.state.claims.get(player1Id);
      const player1Correct = player1Claim === player2Id;

      // Check if player2 claimed player1
      const player2Claim = this.state.claims.get(player2Id);
      const player2Correct = player2Claim === player1Id;

      // Both must be correct for the pair to match
      if (player1Correct && player2Correct) {
        matchedCorrectly.push([player1Id, player2Id]);
      }
    }

    // Scoring: Each player in a correctly matched pair gets 2 points
    for (const [player1, player2] of matchedCorrectly) {
      const current1 = this.room.scores.get(player1) || 0;
      this.room.scores.set(player1, current1 + 2);

      const current2 = this.room.scores.get(player2) || 0;
      this.room.scores.set(player2, current2 + 2);
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
