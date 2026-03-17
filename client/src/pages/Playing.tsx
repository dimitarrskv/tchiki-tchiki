import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { CircularTimer } from '../components/game/CircularTimer';
import { useCountdownSound } from '../hooks/useCountdownSound';
import { GamePhase } from 'shared/src/types';
import { ShareButton } from '../components/game/ShareButton';
import { unlockAudio } from '../lib/audio';

interface TrackInfo {
  name: string;
  artist: string;
  imageUrl: string;
}

export function Playing() {
  const { room, playerId, phaseData, pairResults, isHost, leaveRoom, returnToLobby, error } = useGame();
  const { socket } = useSocket();
  const [countdown, setCountdown] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [phaseDuration, setPhaseDuration] = useState<number>(0);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const phaseStartTimeRef = useRef<number | null>(null);
  const [trackInfoMap, setTrackInfoMap] = useState<Record<string, TrackInfo>>({});
  const [nextRoundIn, setNextRoundIn] = useState<number | null>(null);
  const [activePairIndex, setActivePairIndex] = useState(0);
  const pairsScrollRef = useRef<HTMLDivElement>(null);
  const [audioReady, setAudioReady] = useState(false);

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
      // Restore claim from rejoin sync, or reset to null for fresh round
      setSelectedPartner(phaseData?.restoredClaimPartnerId || null);
    }
    if (room?.phase !== GamePhase.COUNTDOWN) {
      setCountdown(0);
      setAudioReady(false);
    }
    setActivePairIndex(0);
  }, [room?.phase]);

  const handlePairsScroll = useCallback(() => {
    const el = pairsScrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActivePairIndex(index);
  }, []);

  const scrollToPair = useCallback((index: number) => {
    const el = pairsScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
  }, []);

  const handleClaimMatch = (partnerId: string) => {
    if (!socket) return;
    setSelectedPartner(partnerId);
    socket.emit('game:claimMatch', { partnerId });
  };

  if (!room) return null;

  return (
    <MobileShell>
      <Header />
      <div className={`flex-1 flex flex-col items-center text-center min-h-0 ${
        room.phase === GamePhase.COUNTDOWN ? 'justify-center' : ''
      }`}>
        {room.phase === GamePhase.COUNTDOWN && (
          <div className="w-full" onClick={() => { unlockAudio(); setAudioReady(true); }}>
            {/* Round Number */}
            <div className="mb-4 text-text-muted font-mono text-sm uppercase tracking-wide">
              Round {room.roundNumber} / {room.roundLimit ?? 5}
            </div>

            {/* Animated Countdown Number */}
            <div
              key={countdown}
              className="mb-8"
              style={{
                animation: 'countdownPop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div
                className={`text-9xl font-bold ${
                  countdown === 3 ? 'text-primary' :
                  countdown === 2 ? 'text-yellow-400' :
                  'text-red-400'
                }`}
                style={{
                  textShadow: `0 0 20px ${
                    countdown === 3 ? 'rgba(0, 240, 255, 0.5)' :
                    countdown === 2 ? 'rgba(255, 193, 7, 0.5)' :
                    'rgba(255, 87, 87, 0.5)'
                  }`,
                  WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)',
                }}
              >
                {countdown}
              </div>
            </div>

            <div
              className="text-4xl font-bold mb-4 text-primary"
              style={{
                animation: 'fadeInUp 0.5s ease-out',
                textShadow: '0 0 10px var(--color-primary)',
              }}
            >
              Get Ready
            </div>

            <p
              className={`font-mono mb-6 transition-colors ${
                audioReady ? 'text-success' : 'text-primary'
              }`}
              style={{
                animation: audioReady ? 'fadeInUp 0.6s ease-out' : 'fadeInUp 0.6s ease-out, pulse 1.5s ease-in-out infinite',
              }}
            >
              {audioReady ? '> sound on' : '> tap for sound'}
            </p>

            <div
              className="mt-8 text-text-muted text-sm font-mono border border-primary/30 rounded-lg p-4 bg-bg-card"
              style={{
                animation: 'fadeInUp 0.7s ease-out'
              }}
            >
              <div className="text-primary mb-2 font-bold">// OBJECTIVE</div>
              <div>Find who's hearing the same track</div>
            </div>

            <style>{`
              @keyframes countdownPop {
                0% {
                  transform: scale(0.3);
                  opacity: 0;
                  filter: blur(4px);
                }
                50% {
                  transform: scale(1.1);
                  filter: blur(0);
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                  filter: blur(0);
                }
              }

              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                  filter: blur(4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                  filter: blur(0);
                }
              }

              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </div>
        )}

        {room.phase === GamePhase.PLAYING && (
          <div className="w-full relative pb-2 flex-1 flex flex-col min-h-0">
            {/* Round Number */}
            <div className="mb-2 text-text-muted font-mono text-sm uppercase tracking-wide relative z-10">
              Round {room.roundNumber} / {room.roundLimit ?? 5}
            </div>

            <div
              className="text-4xl font-bold mb-4 text-primary relative z-10"
              style={{
                animation: 'slideInFromTop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                textShadow: '0 0 10px var(--color-primary)',
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
                Who has the same track?
              </p>
              {error && error.toLowerCase().includes('preview') && (
                <div className="text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-1.5">
                  Audio unavailable for this round — guess by watching others!
                </div>
              )}
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
            <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide relative z-10 shrink-0">
              {'>'} pick your match:
            </div>
            <div className="space-y-2 relative z-10 overflow-y-auto min-h-0 flex-1 pb-2">
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
                  locked in — change anytime
                </div>
              )}
            </div>
          </div>
        )}

        {(room.phase === GamePhase.REVEAL || room.phase === GamePhase.RESULTS) && (
          <div className="w-full max-w-md flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div
              className="text-center mb-4 shrink-0"
              style={{
                animation: 'revealBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div
                className="text-4xl font-bold mb-4 text-primary"
                style={{ textShadow: '0 0 10px var(--color-primary)' }}
              >
                {room.phase === GamePhase.REVEAL ? 'Reveal' : 'Results'}
              </div>
              <p className="text-text-muted font-mono text-sm">
                {room.phase === GamePhase.REVEAL
                  ? 'pairs revealed'
                  : room.roundNumber >= (room.roundLimit ?? 5)
                    ? `final round — results incoming`
                    : `Round ${room.roundNumber} / ${room.roundLimit ?? 5}${nextRoundIn != null && nextRoundIn > 0 ? ` — Next in ${nextRoundIn}s...` : ' — Starting...'}`}
              </p>
            </div>

            <style>{`
              @keyframes revealBounce {
                0% {
                  opacity: 0;
                  transform: scale(0.5) translateY(-50px);
                }
                60% {
                  transform: scale(1.05) translateY(0);
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

            {/* Pairs Carousel */}
            {pairResults && (() => {
              // Sort pairs so current player's pair comes first
              const sortedIndices = pairResults.pairs
                .map((_, i) => i)
                .sort((a, b) => {
                  const aHasMe = pairResults.pairs[a].includes(playerId!);
                  const bHasMe = pairResults.pairs[b].includes(playerId!);
                  if (aHasMe && !bHasMe) return -1;
                  if (!aHasMe && bHasMe) return 1;
                  return 0;
                });

              return (
              <div className="mb-4 shrink-0">
                <div
                  className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide"
                  style={{ animation: 'fadeIn 0.5s ease-out' }}
                >
                  {'>'} Pairs ({activePairIndex + 1}/{pairResults.pairs.length}):
                </div>
                {/* Carousel container */}
                <div
                  ref={pairsScrollRef}
                  onScroll={handlePairsScroll}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                >
                  {sortedIndices.map((originalIndex) => {
                    const pair = pairResults.pairs[originalIndex];
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
                    const isMyPair = pair.includes(playerId!);

                    return (
                      <div
                        key={originalIndex}
                        className={`p-3 rounded-lg border-2 transition-all snap-start shrink-0 w-[85%] ${
                          isPerfectMatch
                            ? 'bg-success/10 border-success shadow-[0_0_20px_rgba(0,255,128,0.3)]'
                            : (player1Correct || player2Correct)
                            ? 'bg-primary/5 border-primary/50'
                            : 'bg-bg-card border-primary/30'
                        }`}
                      >
                        {/* Badge */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-text-muted font-mono text-xs">
                            {isMyPair ? 'Your Pair' : `Pair ${originalIndex + 1}`}
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
                          {isSolo && (
                            <span className="text-text-muted text-xs font-mono">[SOLO]</span>
                          )}
                        </div>
                        {/* Players */}
                        <div className="flex items-center gap-2 text-left">
                          <span className={`font-mono text-sm uppercase tracking-wide truncate ${
                            player1Correct ? 'text-primary' : ''
                          }`}>
                            {player1?.name || 'Unknown'}
                            {player1Correct && !isPerfectMatch && ' ✓'}
                          </span>
                          {!isSolo && (
                            <>
                              <span className="text-primary shrink-0">↔</span>
                              <span className={`font-mono text-sm uppercase tracking-wide truncate ${
                                player2Correct ? 'text-primary' : ''
                              }`}>
                                {player2?.name || 'Unknown'}
                                {player2Correct && !isPerfectMatch && ' ✓'}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Song info */}
                        {pairResults.trackUris?.[originalIndex] && trackInfoMap[pairResults.trackUris[originalIndex]] && (() => {
                          const track = trackInfoMap[pairResults.trackUris[originalIndex]];
                          return (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-primary/10">
                              <img
                                src={track.imageUrl}
                                alt={track.name}
                                className="w-8 h-8 rounded shrink-0"
                              />
                              <div className="min-w-0 flex-1 text-left">
                                <div className="font-mono text-xs text-primary truncate">{track.name}</div>
                                <div className="font-mono text-xs text-text-muted truncate">{track.artist}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
                {/* Dot indicators */}
                {pairResults.pairs.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {pairResults.pairs.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToPair(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activePairIndex
                            ? 'bg-primary scale-125'
                            : 'bg-primary/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              );
            })()}

            {/* Scores */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide shrink-0">
                {'>'} Scores:
              </div>
              <div className="bg-bg-card border-2 border-primary/30 rounded-lg p-4 flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-2">
                  {[...room.players]
                    .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                    .map((player, index) => {
                      const score = room.scores[player.id] || 0;
                      const isCurrentPlayer = player.id === playerId;
                      const gotPointThisRound = pairResults?.correctGuesses?.includes(player.id);
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
                            {gotPointThisRound && (
                              <span className="text-success text-xs">+1</span>
                            )}
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
            <div className="w-full max-w-md flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div
                className="text-center mb-4 shrink-0"
                style={{
                  animation: 'revealBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div
                  className="text-4xl font-bold mb-4 text-primary"
                  style={{ textShadow: '0 0 10px var(--color-primary)' }}
                >
                  Game Over
                </div>
                <p className="text-text-muted font-mono text-sm">
                  {room.roundNumber} {room.roundNumber === 1 ? 'round' : 'rounds'} played
                </p>
              </div>

              {/* Scrollable standings + stats */}
              <div className="flex-1 min-h-0 overflow-y-auto pb-2">
                {/* Final Standings */}
                <div className="mb-4">
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
                            animation: `slideInLeft 0.5s ease-out ${index * 0.15}s both`
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

              </div>

              {/* Fixed bottom actions */}
              <div className="shrink-0 pt-4 space-y-3">
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
            </div>
          );
        })()}
      </div>
    </MobileShell>
  );
}
