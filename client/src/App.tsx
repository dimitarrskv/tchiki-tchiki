import { useGame } from './context/GameContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Playing } from './pages/Playing';
import { SpotifyCallback } from './pages/SpotifyCallback';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useWakeLock } from './hooks/useWakeLock';
import { GamePhase } from 'shared/src/types';

export function App() {
  const { room } = useGame();

  // Enable wake lock during active gameplay to prevent phone sleep
  const isPlaying = room?.phase && [
    GamePhase.COUNTDOWN,
    GamePhase.PLAYING,
    GamePhase.REVEAL,
    GamePhase.RESULTS,
  ].includes(room.phase);

  useWakeLock(!!isPlaying);

  // Handle Spotify OAuth callback
  if (window.location.pathname === '/spotify-callback') {
    return <SpotifyCallback />;
  }

  let content;

  // No room yet → show home/join screen
  if (!room) {
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
