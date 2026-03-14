import { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { CircularTimer } from '../components/game/CircularTimer';
import { useCountdownSound } from '../hooks/useCountdownSound';
import { GamePhase } from 'shared/src/types';
import { ShareButton } from '../components/game/ShareButton';

interface TrackInfo {
  name: string;
  artist: string;
  imageUrl: string;
}

export function Playing() {
  const { room, playerId, phaseData, pairResults, isHost, leaveRoom, returnToLobby } = useGame();
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [phaseDuration, setPhaseDuration] = useState<number>(0);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const phaseStartTimeRef = useRef<number | null>(null);
  const [trackInfoMap, setTrackInfoMap] = useState<Record<string, TrackInfo>>({});
  const [nextRoundIn, setNextRoundIn] = useState<number | null>(null);

  // Play countdown sounds
  useCountdownSound(countdown, room?.phase === GamePhase.COUNTDOWN);

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
      const serverTimestamp = phaseData?.serverTimestamp;
      if (serverTimestamp) {
        phaseStartTimeRef.current = serverTimestamp;
      } else {
        phaseStartTimeRef.current = Date.now();
      }
      const duration = phaseData?.durationMs || 0;
      setPhaseDuration(duration);
    } else if (room.phase !== GamePhase.PLAYING) {
      phaseStartTimeRef.current = null;
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

  // Build track info map from server-provided metadata
  useEffect(() => {
    if (!pairResults?.trackUris || !pairResults.trackMeta) return;

    const map: Record<string, TrackInfo> = {};
    pairResults.trackUris.forEach((uri, i) => {
      const meta = pairResults.trackMeta[i];
      if (meta) {
        map[uri] = { name: meta.name, artist: meta.artist, imageUrl: meta.imageUrl };
      }
    });
    setTrackInfoMap(map);
  }, [pairResults?.trackUris, pairResults?.trackMeta]);

  // Auto-advance countdown for RESULTS phase
  useEffect(() => {
    if (!room || room.phase !== GamePhase.RESULTS) {
      setNextRoundIn(null);
      return;
    }

    const autoAdvanceMs = phaseData?.autoAdvanceMs;
    if (!autoAdvanceMs) return;

    const startTime = Date.now();
    setNextRoundIn(Math.ceil(autoAdvanceMs / 1000));

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, autoAdvanceMs - elapsed);
      setNextRoundIn(Math.ceil(remaining / 1000));
      if (remaining === 0) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [room?.phase, phaseData]);

  // Reset state when phase changes
  useEffect(() => {
    if (room?.phase === GamePhase.PLAYING) {
      setSelectedPartner(null);
    }
    if (room?.phase !== GamePhase.COUNTDOWN) {
      setCountdown(0);
    }
  }, [room?.phase]);

  const handleClaimMatch = (partnerId: string) => {
    if (!socket) return;
    setSelectedPartner(partnerId);
    socket.emit('game:claimMatch', { partnerId });
  };

  if (!room) return null;

  const isScrollablePhase = room.phase === GamePhase.REVEAL
    || room.phase === GamePhase.RESULTS
    || room.phase === GamePhase.GAME_OVER;

  return (
    <MobileShell>
      <Header />
      <div className={`flex-1 flex flex-col items-center text-center px-6 min-h-0 ${
        isScrollablePhase ? 'overflow-y-auto pb-4' : 'justify-center'
      }`}>
        {room.phase === GamePhase.COUNTDOWN && (
          <div className="w-full">
            {/* Round Number */}
            <div className="mb-4 text-text-muted font-mono text-sm uppercase tracking-wide">
              Round {room.roundNumber} / {room.roundLimit}
            </div>

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
              {'>'} Put your headphones on...
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

            <style>{`
              @keyframes countdownPop {
                0% {
                  transform: scale(0.3);
                  opacity: 0;
                }
                50% {
                  transform: scale(1.15);
                }
                100% {
                  transform: scale(1);
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
          <div className="w-full relative">
            {/* Round Number */}
            <div className="mb-2 text-text-muted font-mono text-sm uppercase tracking-wide relative z-10">
              Round {room.roundNumber} / {room.roundLimit}
            </div>

            <div
              className="text-4xl font-bold mb-4 text-primary relative z-10"
              style={{
                animation: 'slideInFromTop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                textShadow: '0 0 20px var(--color-primary)',
              }}
            >
              Find Your Match
            </div>

            <div className="mb-4 relative z-10">
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
            <div className="w-full max-w-md mx-auto mb-6 flex justify-center relative z-10">
              <CircularTimer
                timeRemaining={timeRemaining}
                totalDuration={phaseDuration}
              />
            </div>

            {/* Partner selection */}
            <div className="space-y-2 relative z-10">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide">
                {'>'} Select your match:
              </div>
              {room.players
                .filter(p => p.id !== playerId)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleClaimMatch(player.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-colors font-mono text-sm ${
                      selectedPartner === player.id
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-bg-card border-primary/30 hover:border-primary hover:bg-bg-hover cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-success' : 'bg-text-muted'}`}></div>
                        <span className="uppercase tracking-wide">{player.name}</span>
                      </div>
                      {selectedPartner === player.id && (
                        <span className="text-primary text-xs">[SELECTED]</span>
                      )}
                    </div>
                  </button>
                ))}
              {selectedPartner && (
                <div className="mt-2 text-center text-success text-xs font-mono">
                  Match selected - You can change it before time runs out
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
                {room.phase === GamePhase.REVEAL ? 'Reveal' : 'Results'}
              </div>
              <p className="text-text-muted font-mono text-sm">
                {room.phase === GamePhase.REVEAL
                  ? 'Here are the pairs...'
                  : room.roundNumber >= room.roundLimit
                    ? `Final Round — Results incoming...`
                    : `Round ${room.roundNumber} / ${room.roundLimit}${nextRoundIn != null && nextRoundIn > 0 ? ` — Next in ${nextRoundIn}s...` : ' — Starting...'}`}
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
                  {'>'} Pairs:
                </div>
                {pairResults.pairs.map((pair, index) => {
                  const [player1Id, player2Id] = pair;
                  const player1 = room.players.find(p => p.id === player1Id);
                  const player2 = room.players.find(p => p.id === player2Id);

                  const isPerfectMatch = pairResults.matchedCorrectly.some(
                    match => (match[0] === player1Id && match[1] === player2Id) ||
                             (match[1] === player1Id && match[0] === player2Id)
                  );

                  const player1Correct = pairResults.correctGuesses?.includes(player1Id);
                  const player2Correct = pairResults.correctGuesses?.includes(player2Id);

                  const isSolo = player1Id === player2Id;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isPerfectMatch
                          ? 'bg-success/10 border-success shadow-[0_0_20px_rgba(0,255,128,0.3)]'
                          : (player1Correct || player2Correct)
                          ? 'bg-primary/5 border-primary/50'
                          : 'bg-bg-card border-primary/30'
                      }`}
                      style={{
                        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`font-mono text-sm uppercase tracking-wide ${
                              player1Correct ? 'text-primary' : ''
                            }`}>
                              {player1?.name || 'Unknown'}
                              {player1Correct && !isPerfectMatch && ' ✓'}
                            </span>
                            {!isSolo && (
                              <>
                                <span className="text-primary">↔</span>
                                <span className={`font-mono text-sm uppercase tracking-wide ${
                                  player2Correct ? 'text-primary' : ''
                                }`}>
                                  {player2?.name || 'Unknown'}
                                  {player2Correct && !isPerfectMatch && ' ✓'}
                                </span>
                              </>
                            )}
                            {isSolo && (
                              <span className="text-text-muted text-xs">(solo)</span>
                            )}
                          </div>
                          {isPerfectMatch && (
                            <span className="text-success text-xs font-mono">[MATCH]</span>
                          )}
                          {!isPerfectMatch && (player1Correct || player2Correct) && !isSolo && (
                            <span className="text-primary text-xs font-mono">[PARTIAL]</span>
                          )}
                          {!isPerfectMatch && !player1Correct && !player2Correct && !isSolo && (
                            <span className="text-text-muted text-xs font-mono">[MISS]</span>
                          )}
                        </div>
                        {/* Song info */}
                        {pairResults.trackUris?.[index] && trackInfoMap[pairResults.trackUris[index]] && (() => {
                          const track = trackInfoMap[pairResults.trackUris[index]];
                          return (
                            <div className="flex items-center gap-3 mt-1 pt-2 border-t border-primary/10">
                              <img
                                src={track.imageUrl}
                                alt={track.name}
                                className="w-10 h-10 rounded"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-xs text-primary truncate">{track.name}</div>
                                <div className="font-mono text-xs text-text-muted truncate">{track.artist}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scores */}
            <div className="mb-6">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide">
                {'>'} Scores:
              </div>
              <div className="bg-bg-card border-2 border-primary/30 rounded-lg p-4">
                <div className="space-y-2">
                  {[...room.players]
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

          </div>
        )}

        {room.phase === GamePhase.GAME_OVER && (() => {
          const sortedPlayers = [...room.players].sort(
            (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
          );
          const myRank = sortedPlayers.findIndex(p => p.id === playerId) + 1;
          const myScore = room.scores[playerId!] || 0;
          const amWinner = sortedPlayers[0]?.id === playerId && myScore > 0;

          return (
            <div className="w-full max-w-md">
              {/* Header */}
              <div
                className="text-center mb-6"
                style={{
                  animation: 'revealBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div className="text-5xl font-bold mb-4 text-primary neon-text">
                  Game Over
                </div>
                <p className="text-text-muted font-mono text-sm">
                  {room.roundNumber} {room.roundNumber === 1 ? 'round' : 'rounds'} played
                </p>
              </div>

              {/* Final Standings */}
              <div className="mb-6">
                <div className="text-xs text-text-muted font-mono mb-3 uppercase tracking-wide">
                  {'>'} Final Standings:
                </div>
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => {
                    const score = room.scores[player.id] || 0;
                    const isCurrentPlayer = player.id === playerId;
                    const isWinner = index === 0 && score > 0;

                    return (
                      <div
                        key={player.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isWinner
                            ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(0,240,255,0.4)]'
                            : 'bg-bg-card border-primary/30'
                        }`}
                        style={{
                          animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${
                              isWinner ? 'text-primary' : 'text-text-muted'
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <div className={`font-mono uppercase tracking-wide ${
                                isCurrentPlayer ? 'text-primary font-bold' : ''
                              }`}>
                                {player.name}
                                {isCurrentPlayer && ' (you)'}
                              </div>
                              {isWinner && (
                                <div className="text-xs text-primary font-mono">
                                  Winner
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`text-2xl font-bold font-mono ${
                            score > 0 ? 'text-success' : 'text-text-muted'
                          }`}>
                            {score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics */}
              <div className="mb-6 p-4 bg-bg-card border-2 border-primary/30 rounded-lg">
                <div className="text-xs text-text-muted font-mono mb-3 uppercase tracking-wide">
                  {'>'} Game Stats:
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Rounds:</span>
                    <span className="text-primary">{room.roundNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Players:</span>
                    <span className="text-primary">{room.players.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Points:</span>
                    <span className="text-primary">
                      {Object.values(room.scores).reduce((sum, score) => sum + score, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <div className="mb-4">
                <ShareButton
                  data={{
                    playerName: room.players.find(p => p.id === playerId)?.name || 'Player',
                    playerRank: myRank,
                    playerScore: myScore,
                    totalPlayers: room.players.length,
                    totalRounds: room.roundNumber,
                    isWinner: amWinner,
                    appUrl: window.location.host,
                  }}
                />
              </div>

              {/* Host Controls */}
              {isHost ? (
                <button
                  onClick={returnToLobby}
                  className="w-full bg-primary text-bg-primary font-bold py-4 px-4 rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] font-mono uppercase tracking-wide"
                >
                  Return to Lobby
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center text-text-muted text-sm font-mono">
                    Waiting for host to return to lobby...
                  </div>
                  <button
                    onClick={leaveRoom}
                    className="w-full bg-bg-card border-2 border-secondary/40 hover:border-secondary text-secondary font-mono py-3 px-4 rounded-lg transition-all uppercase tracking-wide text-sm"
                  >
                    Leave Game
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </MobileShell>
  );
}
