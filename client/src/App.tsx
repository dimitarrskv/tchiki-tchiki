import { useGame } from './context/GameContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { GameSelect } from './pages/GameSelect';
import { Playing } from './pages/Playing';
import { SpotifyCallback } from './pages/SpotifyCallback';
import { GamePhase } from 'shared/src/types';

export function App() {
  const { room } = useGame();

  // Handle Spotify OAuth callback
  if (window.location.pathname === '/spotify-callback') {
    return <SpotifyCallback />;
  }

  // No room yet → show home/join screen
  if (!room) {
    return <Home />;
  }

  // Route based on game phase
  switch (room.phase) {
    case GamePhase.LOBBY:
      return <Lobby />;

    case GamePhase.MODE_SELECT:
      return <GameSelect />;

    case GamePhase.COUNTDOWN:
    case GamePhase.PLAYING:
    case GamePhase.VOTING:
    case GamePhase.MATCHING:
    case GamePhase.CATCHING:
    case GamePhase.REVEAL:
    case GamePhase.RESULTS:
    case GamePhase.FINAL_SCORES:
      return <Playing />;

    default:
      return <Home />;
  }
}
