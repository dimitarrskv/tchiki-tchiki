import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { App } from './App';
import './styles/globals.css';

const isDevMode = new URLSearchParams(window.location.search).has('dev');

if (isDevMode) {
  // Lazy import dev modules to keep them out of production bundles
  Promise.all([
    import('./dev/DevProvider'),
    import('./dev/DevPanel'),
  ]).then(([{ DevProvider }, { DevPanel }]) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <DevProvider>
          <App />
          <DevPanel />
        </DevProvider>
      </StrictMode>,
    );
  });
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SocketProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SocketProvider>
    </StrictMode>,
  );
}
