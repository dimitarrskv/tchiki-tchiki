import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { GamePhase } from 'shared/src/types';

export function Playing() {
  const { room, playerId, phaseData } = useGame();
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [phaseDuration, setPhaseDuration] = useState<number>(0);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  // Listen for countdown events
  useEffect(() => {
    if (!socket) return;

    const handleCountdown = ({ count }: { count: number }) => {
      setCountdown(count);
    };

    socket.on('game:countdown', handleCountdown);
    return () => {
      socket.off('game:countdown', handleCountdown);
    };
  }, [socket]);

  // Handle timer for PLAYING phase
  useEffect(() => {
    if (!room) return;

    if (room.phase === GamePhase.PLAYING) {
      const duration = phaseData?.durationMs || 0;
      setPhaseDuration(duration);
      setTimeRemaining(duration);

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [room?.phase, phaseData]);

  // Reset selected partner when entering playing phase
  useEffect(() => {
    if (room?.phase === GamePhase.PLAYING) {
      setSelectedPartner(null);
    }
  }, [room?.phase]);

  const handleClaimMatch = (partnerId: string) => {
    if (!socket) return;
    setSelectedPartner(partnerId);
    socket.emit('game:claimMatch', { partnerId });
  };

  if (!room) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return seconds;
  };

  const getProgress = () => {
    if (phaseDuration === 0) return 0;
    return ((phaseDuration - timeRemaining) / phaseDuration) * 100;
  };

  return (
    <MobileShell>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        {room.phase === GamePhase.COUNTDOWN && (
          <div className="w-full">
            <div className="text-7xl font-bold text-primary mb-8 animate-pulse" style={{
              textShadow: '0 0 30px rgba(0, 240, 255, 0.8)',
              animation: 'pulse 0.5s ease-in-out'
            }}>
              {countdown}
            </div>
            <div className="text-2xl font-bold mb-4 text-primary neon-text">
              Get Ready!
            </div>
            <p className="text-text-muted font-mono">
              &gt; Put your headphones on...
            </p>
            <div className="mt-8 text-text-muted text-sm font-mono border border-primary/30 rounded-lg p-4 bg-bg-card">
              <div className="text-primary mb-2">// OBJECTIVE</div>
              <div>Find the person hearing the same song as you!</div>
            </div>
          </div>
        )}

        {room.phase === GamePhase.PLAYING && (
          <div className="w-full">
            <div className="text-4xl font-bold mb-4 text-primary neon-text">
              🎵 Find Your Match
            </div>

            <div className="mb-4">
              <p className="text-text-muted mb-4 font-mono text-sm">
                Who is hearing the same song as you?
              </p>
            </div>

            {/* Timer */}
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-muted text-sm font-mono">&gt; TIME</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  {formatTime(timeRemaining)}s
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-3 bg-bg-card border-2 border-primary/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-100"
                  style={{
                    width: `${getProgress()}%`,
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)'
                  }}
                />
              </div>
            </div>

            {/* Partner selection */}
            <div className="space-y-2">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide">
                &gt; Select your match:
              </div>
              {room.players
                .filter(p => p.id !== playerId) // Don't show yourself
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleClaimMatch(player.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all font-mono text-sm ${
                      selectedPartner === player.id
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                        : 'bg-bg-card border-primary/30 hover:border-primary hover:bg-bg-hover cursor-pointer hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-success' : 'bg-text-muted'}`}></div>
                        <span className="uppercase tracking-wide">{player.name}</span>
                      </div>
                      {selectedPartner === player.id && (
                        <span className="text-primary text-xs">[✓]</span>
                      )}
                    </div>
                  </button>
                ))}
              {selectedPartner && (
                <div className="mt-2 text-center text-success text-xs font-mono">
                  ✓ Match selected • You can change it before time runs out
                </div>
              )}
            </div>
          </div>
        )}

        {(room.phase === GamePhase.REVEAL || room.phase === GamePhase.RESULTS) && (
          <div>
            <div className="text-4xl font-bold mb-4">Results</div>
            {/* Results UI will be built in Milestone 3 */}
            <div className="text-text-muted text-sm">
              Results UI coming in Milestone 3
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
