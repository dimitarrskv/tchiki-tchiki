import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SocketProvider } from './context/SocketContext';
import { SpotifyProvider } from './context/SpotifyContext';
import { GameProvider } from './context/GameContext';
import { App } from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <SpotifyProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SpotifyProvider>
    </SocketProvider>
  </StrictMode>,
);
