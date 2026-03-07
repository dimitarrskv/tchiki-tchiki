import { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { CircularTimer } from '../components/game/CircularTimer';
import { GamePhase } from 'shared/src/types';

export function Playing() {
  const { room, playerId, phaseData, pairResults, isHost, nextRound, endGame } = useGame();
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [phaseDuration, setPhaseDuration] = useState<number>(0);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const phaseStartTimeRef = useRef<number | null>(null);

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

  // Store phase start time when entering PLAYING phase
  useEffect(() => {
    if (!room) return;

    if (room.phase === GamePhase.PLAYING && phaseStartTimeRef.current === null) {
      // Use server timestamp if available, otherwise fall back to client time
      const serverTimestamp = phaseData?.serverTimestamp;
      if (serverTimestamp) {
        phaseStartTimeRef.current = serverTimestamp;
        console.log('⏱️  Using server timestamp for timer sync:', serverTimestamp);
      } else {
        phaseStartTimeRef.current = Date.now();
        console.warn('⚠️  No server timestamp, using client time');
      }
      const duration = phaseData?.durationMs || 0;
      setPhaseDuration(duration);
      console.log('⏱️  Timer initialized - Duration:', duration, 'ms');
    } else if (room.phase !== GamePhase.PLAYING) {
      // Reset start time when leaving PLAYING phase
      phaseStartTimeRef.current = null;
      console.log('⏱️  Timer reset - left PLAYING phase');
    }
  }, [room?.phase, phaseData]);

  // Handle timer for PLAYING phase
  useEffect(() => {
    if (!room) return;

    if (room.phase === GamePhase.PLAYING && phaseStartTimeRef.current !== null) {
      const startTime = phaseStartTimeRef.current;
      const duration = phaseDuration;

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
  }, [room?.phase, phaseDuration]);

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

  return (
    <MobileShell>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        {room.phase === GamePhase.COUNTDOWN && (
          <div className="w-full">
            {/* Animated Countdown Number */}
            <div
              key={countdown}
              className="mb-8"
              style={{
                animation: 'countdownPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div
                className={`text-9xl font-bold ${
                  countdown === 3 ? 'text-primary' :
                  countdown === 2 ? 'text-yellow-400' :
                  'text-red-400'
                }`}
                style={{
                  textShadow: `0 0 40px ${
                    countdown === 3 ? 'rgba(0, 240, 255, 0.9)' :
                    countdown === 2 ? 'rgba(255, 193, 7, 0.9)' :
                    'rgba(255, 87, 87, 0.9)'
                  }`,
                  WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)',
                }}
              >
                {countdown}
              </div>
            </div>

            <div
              className="text-3xl font-bold mb-4 text-primary"
              style={{
                animation: 'fadeInUp 0.5s ease-out',
                textShadow: '0 0 20px rgba(0, 240, 255, 0.6)'
              }}
            >
              Get Ready!
            </div>

            <p
              className="text-text-muted font-mono mb-6"
              style={{
                animation: 'fadeInUp 0.6s ease-out'
              }}
            >
              &gt; Put your headphones on...
            </p>

            <div
              className="mt-8 text-text-muted text-sm font-mono border border-primary/30 rounded-lg p-4 bg-bg-card"
              style={{
                animation: 'fadeInUp 0.7s ease-out'
              }}
            >
              <div className="text-primary mb-2 font-bold">// OBJECTIVE</div>
              <div>Find the person hearing the same song as you!</div>
            </div>

            {/* Add keyframe animations via style tag */}
            <style>{`
              @keyframes countdownPop {
                0% {
                  transform: scale(0.3) rotate(-10deg);
                  opacity: 0;
                }
                50% {
                  transform: scale(1.15) rotate(5deg);
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }

              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )}

        {room.phase === GamePhase.PLAYING && (
          <div className="w-full">
            <div
              className="text-4xl font-bold mb-4 text-primary neon-text"
              style={{
                animation: 'slideInFromTop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              🎵 Find Your Match
            </div>

            <div className="mb-4">
              <p
                className="text-text-muted mb-4 font-mono text-sm"
                style={{
                  animation: 'fadeIn 0.8s ease-out'
                }}
              >
                Who is hearing the same song as you?
              </p>
            </div>

            <style>{`
              @keyframes slideInFromTop {
                from {
                  opacity: 0;
                  transform: translateY(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>

            {/* Circular Timer */}
            <div className="w-full max-w-md mx-auto mb-6 flex justify-center">
              <CircularTimer
                timeRemaining={timeRemaining}
                totalDuration={phaseDuration}
              />
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
          <div className="w-full max-w-md">
            {/* Header */}
            <div
              className="text-center mb-6"
              style={{
                animation: 'revealBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="text-4xl font-bold mb-2 text-primary neon-text">
                {room.phase === GamePhase.REVEAL ? '🎭 Reveal' : '📊 Results'}
              </div>
              <p className="text-text-muted font-mono text-sm">
                {room.phase === GamePhase.REVEAL ? 'Here are the pairs...' : `Round ${room.roundNumber} Complete`}
              </p>
            </div>

            <style>{`
              @keyframes revealBounce {
                0% {
                  opacity: 0;
                  transform: scale(0.5) translateY(-50px);
                }
                60% {
                  transform: scale(1.1) translateY(0);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }

              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>

            {/* Pairs Display */}
            {pairResults && (
              <div className="space-y-3 mb-6">
                <div
                  className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide"
                  style={{
                    animation: 'fadeIn 0.5s ease-out'
                  }}
                >
                  &gt; Pairs:
                </div>
                {pairResults.pairs.map((pair, index) => {
                  const [player1Id, player2Id] = pair;
                  const player1 = room.players.find(p => p.id === player1Id);
                  const player2 = room.players.find(p => p.id === player2Id);

                  // Check if this pair matched correctly
                  const isCorrect = pairResults.matchedCorrectly.some(
                    match => (match[0] === player1Id && match[1] === player2Id) ||
                             (match[1] === player1Id && match[0] === player2Id)
                  );

                  const isSolo = player1Id === player2Id;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCorrect
                          ? 'bg-success/10 border-success shadow-[0_0_20px_rgba(0,255,128,0.3)]'
                          : 'bg-bg-card border-primary/30'
                      }`}
                      style={{
                        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-sm uppercase tracking-wide">
                            {player1?.name || 'Unknown'}
                          </span>
                          {!isSolo && (
                            <>
                              <span className="text-primary">↔</span>
                              <span className="font-mono text-sm uppercase tracking-wide">
                                {player2?.name || 'Unknown'}
                              </span>
                            </>
                          )}
                          {isSolo && (
                            <span className="text-text-muted text-xs">(solo)</span>
                          )}
                        </div>
                        {isCorrect && (
                          <span className="text-success text-lg">✓</span>
                        )}
                        {!isCorrect && !isSolo && (
                          <span className="text-text-muted text-lg">✗</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scores */}
            <div className="mb-6">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide">
                &gt; Scores:
              </div>
              <div className="bg-bg-card border-2 border-primary/30 rounded-lg p-4">
                <div className="space-y-2">
                  {room.players
                    .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                    .map((player, index) => {
                      const score = room.scores[player.id] || 0;
                      const isCurrentPlayer = player.id === playerId;
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between font-mono text-sm ${
                            isCurrentPlayer ? 'text-primary font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted w-4">{index + 1}.</span>
                            <span className="uppercase tracking-wide">
                              {player.name}
                              {isCurrentPlayer && ' (you)'}
                            </span>
                          </div>
                          <span className={score > 0 ? 'text-success' : ''}>
                            {score} pts
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Host Controls */}
            {room.phase === GamePhase.RESULTS && isHost && (
              <div className="space-y-2">
                <button
                  onClick={nextRound}
                  className="w-full bg-primary text-bg-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] font-mono uppercase tracking-wide"
                >
                  ▶ Next Round
                </button>
                <button
                  onClick={endGame}
                  className="w-full bg-bg-card border-2 border-primary/30 text-text-muted font-mono py-3 px-4 rounded-lg hover:border-primary hover:text-primary transition-all uppercase tracking-wide text-sm"
                >
                  End Game
                </button>
              </div>
            )}

            {/* Non-host message */}
            {room.phase === GamePhase.RESULTS && !isHost && (
              <div className="text-center text-text-muted text-sm font-mono">
                Waiting for host to start next round...
              </div>
            )}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
