import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { App } from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SocketProvider>
  </StrictMode>,
);
