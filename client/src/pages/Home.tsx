import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { unlockAudio, playTestTone } from '../lib/audio';

type PendingAction = { type: 'create'; name: string } | { type: 'join'; name: string; code: string } | null;

export function Home() {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const { isConnected } = useSocket();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Check for room code in URL on mount (invitation link / QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && code.length === 4) {
      setRoomCode(code.toUpperCase());
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    unlockAudio();
    playTestTone();
    setPendingAction({ type: 'create', name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || roomCode.length !== 4) return;
    unlockAudio();
    playTestTone();
    setPendingAction({ type: 'join', name: name.trim(), code: roomCode });
  };

  const handleConfirmAudio = () => {
    if (!pendingAction) return;
    unlockAudio();
    if (pendingAction.type === 'create') {
      createRoom(pendingAction.name);
    } else {
      joinRoom(pendingAction.code, pendingAction.name);
    }
    setPendingAction(null);
  };

  const handleRetryAudio = () => {
    unlockAudio();
    playTestTone();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (roomCode) {
      handleJoin();
    } else {
      handleCreate();
    }
  };

  // Audio gate overlay
  if (pendingAction) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-10">
            <div className="text-6xl mb-6" style={{
              animation: 'countdownPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20 mx-auto text-primary" style={{
                filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.6))'
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text uppercase tracking-wider mb-2">Audio Check</h2>
            <p className="text-text-muted text-sm font-mono">Did you hear the sound?</p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={handleConfirmAudio}
              className="w-full bg-primary hover:bg-primary-hover text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
            >
              {'>'} Yes, continue
            </button>

            <button
              onClick={handleRetryAudio}
              className="w-full border-2 border-primary/50 hover:border-primary text-primary font-bold py-3 rounded-lg transition-all uppercase tracking-wider"
            >
              Play again
            </button>

            <button
              onClick={() => setPendingAction(null)}
              className="w-full text-text-muted hover:text-primary py-2 text-sm transition-colors uppercase tracking-wide"
            >
              {'<'} Back
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-text-muted text-xs font-mono">
              Turn off silent mode and turn up volume
            </p>
          </div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col pt-16">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <div className="font-mono text-primary leading-[0.9]" style={{
              textShadow: '0 0 10px rgba(30, 215, 96, 0.5), 0 0 20px rgba(30, 215, 96, 0.2)'
            }}>
              <pre className="inline-block text-left text-[6px] sm:text-[8px]">
{`████████╗ ██████╗██╗  ██╗██╗██╗  ██╗██╗      ████████╗ ██████╗██╗  ██╗██╗██╗  ██╗██╗
╚══██╔══╝██╔════╝██║  ██║██║██║ ██╔╝██║█████╗╚══██╔══╝██╔════╝██║  ██║██║██║ ██╔╝██║
   ██║   ██║     ███████║██║█████╔╝ ██║╚════╝   ██║   ██║     ███████║██║█████╔╝ ██║
   ██║   ██║     ██╔══██║██║██╔═██╗ ██║         ██║   ██║     ██╔══██║██║██╔═██╗ ██║
   ██║   ╚██████╗██║  ██║██║██║  ██╗██║         ██║   ╚██████╗██║  ██║██║██║  ██╗██║
   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝         ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝`}
              </pre>
            </div>
          </div>
        </div>

        {/* System Console */}
        <div className="bg-black/40 border border-primary/10 rounded-lg p-4 mb-6 font-mono text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            <div className="text-primary/50 uppercase tracking-wider text-[10px]">System Console</div>
          </div>
          <div className="space-y-1.5 text-text-muted">
            <div className="flex items-start gap-2">
              <span className="text-primary/50">[SYS]</span>
              <span className={isConnected ? 'text-success' : 'text-warning animate-pulse'}>
                {isConnected ? '+ Server connected' : 'o Connecting to server...'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary/50">[MODE]</span>
              <span className="text-success">+ Audio ready (30s preview clips)</span>
            </div>
            {error && (
              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-secondary/20">
                <span className="text-secondary">[ERR]</span>
                <span className="text-secondary flex-1">{error}</span>
                <button
                  onClick={clearError}
                  className="text-secondary hover:text-primary transition-colors text-xs px-1"
                >
                  [CLEAR]
                </button>
              </div>
            )}
          </div>
          {isConnected && (
            <div className="mt-3 pt-3 border-t border-success/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-success text-sm uppercase tracking-wider">Systems online</span>
            </div>
          )}
        </div>

        {/* Name input */}
        <div className="mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="> ENTER YOUR NAME"
            maxLength={20}
            className="w-full bg-bg-card border-2 border-primary/50 rounded-lg px-4 py-3 text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all uppercase tracking-wider"
          />
        </div>

        {roomCode ? (
          /* Arrived via invitation link / QR scan */
          <div className="space-y-3">
            <div className="bg-bg-card border-2 border-secondary/50 rounded-lg px-4 py-3 text-center">
              <div className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Joining Room</div>
              <div
                className="text-2xl font-mono tracking-[0.5em] text-primary"
                style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}
              >
                {roomCode}
              </div>
            </div>
            <button
              onClick={handleJoin}
              disabled={!name.trim() || !isConnected}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
            >
              {'>'} Join
            </button>
            <button
              onClick={() => { setRoomCode(''); clearError(); }}
              className="w-full text-text-muted hover:text-primary py-2 text-sm transition-colors uppercase tracking-wide"
            >
              {'<'} Back
            </button>
          </div>
        ) : (
          /* Default: only allow creating a room */
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !isConnected}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
          >
            {'>'} Create
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted py-4 uppercase tracking-widest">
        [ 30s clips // no account required ]
      </div>
    </MobileShell>
  );
}
