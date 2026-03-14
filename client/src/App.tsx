import { useEffect } from 'react';
import { useGame } from './context/GameContext';
import { useSocket } from './context/SocketContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Playing } from './pages/Playing';
import { ConnectionStatus } from './components/ConnectionStatus';
import { MobileShell } from './components/layout/MobileShell';
import { useWakeLock } from './hooks/useWakeLock';
import { getContext } from './lib/audio';
import { GamePhase } from 'shared/src/types';

export function App() {
  const { room } = useGame();
  const { isRejoining } = useSocket();

  // Keep AudioContext alive on iOS — resume on any user tap/click
  useEffect(() => {
    const resume = () => {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener('touchstart', resume, { passive: true });
    document.addEventListener('click', resume);
    return () => {
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('click', resume);
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

  let content;

  // Show loading screen while attempting to rejoin
  if (isRejoining) {
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
      {content}
    </>
  );
}
