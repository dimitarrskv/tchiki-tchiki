import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';

export function Home() {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const { isConnected } = useSocket();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

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

  // Unlock audio playback on mobile browsers (requires user gesture)
  const unlockAudio = () => {
    const silence = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silence.play().catch(() => {});
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    unlockAudio();
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || roomCode.length !== 4) return;
    unlockAudio();
    joinRoom(roomCode, name.trim());
  };

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col pt-16">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <div className="font-mono text-primary leading-[0.9]" style={{
              textShadow: '0 0 15px rgba(30, 215, 96, 0.9), 0 0 30px rgba(30, 215, 96, 0.6), 0 0 45px rgba(30, 215, 96, 0.3)'
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
              <span className="text-success text-sm uppercase tracking-wider">Ready for battle</span>
            </div>
          )}
        </div>

        {/* Name input */}
        <div className="mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        [ 30s Preview Clips - No Account Needed ]
      </div>
    </MobileShell>
  );
}
