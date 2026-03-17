import { useEffect, useState } from 'react';
import { useGame } from './context/GameContext';
import { useSocket } from './context/SocketContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Playing } from './pages/Playing';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ReconnectingOverlay } from './components/ReconnectingOverlay';
import { MobileShell } from './components/layout/MobileShell';
import { useWakeLock } from './hooks/useWakeLock';
import { unlockAudio } from './lib/audio';
import { GamePhase } from 'shared/src/types';

export function App() {
  const { room } = useGame();
  const { isRejoining } = useSocket();
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Unlock audio + AudioContext on any user tap/click.
  // This also tracks whether the user has tapped at least once this session,
  // so we can gate active game phases behind an audio-unlock interstitial.
  useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
      setAudioUnlocked(true);
    };
    document.addEventListener('touchstart', handleGesture, { passive: true });
    document.addEventListener('click', handleGesture);
    return () => {
      document.removeEventListener('touchstart', handleGesture);
      document.removeEventListener('click', handleGesture);
    };
  }, []);

  // Enable wake lock during active gameplay to prevent phone sleep
  const isPlaying = room?.phase && [
    GamePhase.COUNTDOWN,
    GamePhase.PLAYING,
    GamePhase.REVEAL,
    GamePhase.RESULTS,
    GamePhase.GAME_OVER,
  ].includes(room.phase);

  useWakeLock(!!isPlaying);

  // Audio unlock gate: after a page refresh mid-game, iOS requires a user
  // gesture before audio can play. During normal flow, lobby taps handle this.
  // On rejoin into an active phase, show a "tap to continue" interstitial.
  const activeGamePhase = room?.phase && [
    GamePhase.COUNTDOWN,
    GamePhase.PLAYING,
    GamePhase.REVEAL,
    GamePhase.RESULTS,
  ].includes(room.phase);
  const needsAudioGate = !audioUnlocked && activeGamePhase && !isRejoining;

  let content;

  if (needsAudioGate) {
    content = (
      <MobileShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <div
              className="text-4xl font-bold mb-4 text-primary"
              style={{ textShadow: '0 0 10px var(--color-primary)' }}
            >
              Tap to Rejoin
            </div>
            <p
              className="text-text-muted font-mono text-sm mb-8"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              tap anywhere to enable sound
            </p>
            <div className="text-text-muted font-mono text-xs">
              Round {room!.roundNumber} / {room!.roundLimit ?? 5}
            </div>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
            `}</style>
          </div>
        </div>
      </MobileShell>
    );
  }
  // Show loading screen while attempting to rejoin
  else if (isRejoining) {
    content = (
      <MobileShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="connection-spinner mx-auto" style={{ width: 40, height: 40 }} />
            </div>
            <div className="text-primary font-mono text-lg mb-2">Rejoining room...</div>
            <div className="text-text-muted text-sm font-mono">Restoring your session</div>
          </div>
        </div>
      </MobileShell>
    );
  }
  // No room yet → show home/join screen
  else if (!room) {
    content = <Home />;
  } else {
    // Route based on game phase
    switch (room.phase) {
      case GamePhase.LOBBY:
        content = <Lobby />;
        break;

      case GamePhase.COUNTDOWN:
      case GamePhase.PLAYING:
      case GamePhase.REVEAL:
      case GamePhase.RESULTS:
      case GamePhase.GAME_OVER:
        content = <Playing />;
        break;

      default:
        content = <Home />;
    }
  }

  return (
    <>
      <ConnectionStatus />
      <ReconnectingOverlay />
      {content}
    </>
  );
}
