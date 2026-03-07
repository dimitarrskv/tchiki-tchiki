import { BaseGame, TypedServer, GameConfig } from './BaseGame';
import { Room } from '../rooms/Room';
import { GamePhase, PlayerRole } from 'shared/src/types';
import { getRandomTrack } from '../spotify/tracks';

interface OddOneOutState {
  fakerId: string;
  trackUri: string;
  votes: Map<string, string>; // voterId -> targetId
}

export class OddOneOut extends BaseGame {
  private state: OddOneOutState | null = null;

  constructor(io: TypedServer, room: Room, config?: Partial<GameConfig>) {
    super(io, room, config);
  }

  start(): void {
    const players = this.getConnectedPlayers();
    if (players.length < 2) {
      this.emit('room:error', { message: 'Need at least 2 players' });
      return;
    }

    // Pick a random faker from ALL players
    // In physical party mode: faker just doesn't listen to the speakers
    const fakerIndex = Math.floor(Math.random() * players.length);
    const faker = players[fakerIndex];
    const trackUri = getRandomTrack();

    this.state = {
      fakerId: faker.id,
      trackUri,
      votes: new Map(),
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

    // Only send play/silence events to authenticated players (hosts with Spotify)
    const authenticatedPlayers = players.filter(
      p => p.role === PlayerRole.HOST && p.spotifyDeviceId
    );

    // Send play command to all non-fakers, silence to faker
    for (const player of authenticatedPlayers) {
      if (player.id === this.state.fakerId) {
        this.emitToPlayer(player.socketId, 'game:silence');
      } else {
        this.emitToPlayer(player.socketId, 'game:play', { trackUri: this.state.trackUri });
      }
    }

    this.setPhase(GamePhase.PLAYING);

    // Send duration info so clients can show timer
    this.emit('game:phaseChange', {
      phase: GamePhase.PLAYING,
      data: { durationMs: this.config.listenDurationMs }
    });

    // After listen duration, stop music and move to discussion/voting
    this.scheduleTimeout(() => this.stopAndVote(), this.config.listenDurationMs);
  }

  private stopAndVote(): void {
    // Stop music for authenticated players only
    const players = this.getConnectedPlayers();
    const authenticatedPlayers = players.filter(
      p => p.role === PlayerRole.HOST && p.spotifyDeviceId
    );

    for (const player of authenticatedPlayers) {
      this.emitToPlayer(player.socketId, 'game:stop');
    }

    // Move to voting phase
    this.setPhase(GamePhase.VOTING);

    // Send duration info for voting timer
    this.emit('game:phaseChange', {
      phase: GamePhase.VOTING,
      data: { durationMs: this.config.votingDurationMs }
    });

    // Auto-resolve after voting duration
    this.scheduleTimeout(() => this.resolveVotes(), this.config.votingDurationMs);
  }

  handleVote(playerId: string, targetId: string): void {
    if (!this.state || this.room.phase !== GamePhase.VOTING) return;

    // Record the vote
    this.state.votes.set(playerId, targetId);

    // Broadcast vote count (not who voted for whom)
    const totalPlayers = this.getConnectedPlayers().length;
    const totalVotes = this.state.votes.size;
    this.emit('game:phaseChange', {
      phase: GamePhase.VOTING,
      data: { votesIn: totalVotes, totalPlayers },
    });

    // If everyone has voted, resolve immediately
    if (totalVotes >= totalPlayers) {
      // Clear the auto-resolve timer
      this.timers.forEach(t => clearTimeout(t));
      this.timers = [];
      this.resolveVotes();
    }
  }

  private resolveVotes(): void {
    if (!this.state) return;

    // Tally votes
    const voteCounts: Record<string, number> = {};
    for (const targetId of this.state.votes.values()) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    // Find who got the most votes
    let maxVotes = 0;
    let mostVotedId = '';
    for (const [id, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = id;
      }
    }

    const caught = mostVotedId === this.state.fakerId;
    const players = this.getConnectedPlayers();
    const majority = Math.floor(players.length / 2) + 1;

    // Scoring
    if (caught && maxVotes >= majority) {
      // Faker was caught — correct voters get 1 point each
      for (const [voterId, targetId] of this.state.votes.entries()) {
        if (targetId === this.state.fakerId) {
          const current = this.room.scores.get(voterId) || 0;
          this.room.scores.set(voterId, current + 1);
        }
      }
    } else {
      // Faker survived — faker gets 3 points
      const current = this.room.scores.get(this.state.fakerId) || 0;
      this.room.scores.set(this.state.fakerId, current + 3);
    }

    // Reveal phase
    this.setPhase(GamePhase.REVEAL);

    this.emit('game:voteResults', {
      votes: voteCounts,
      fakerId: this.state.fakerId,
      caught: caught && maxVotes >= majority,
    });

    this.emit('game:scores', {
      scores: Object.fromEntries(this.room.scores),
    });

    // Move to results after a delay for the reveal animation
    this.scheduleTimeout(() => {
      this.setPhase(GamePhase.RESULTS);
    }, 5000);
  }

  // Not used in Odd One Out
  handleClaimMatch(_playerId: string, _partnerId: string): void {}
  handleCatchPlayer(_playerId: string, _targetId: string): void {}
}
