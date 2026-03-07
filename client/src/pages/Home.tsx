import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { useSpotify } from '../context/SpotifyContext';
import { startSpotifyAuth } from '../lib/spotify';
import { MobileShell } from '../components/layout/MobileShell';

export function Home() {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const { isConnected } = useSocket();
  const { isAuthenticated, isPlayerReady, isPremium } = useSpotify();
  const [view, setView] = useState<'home' | 'join'>('home');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  // Check for room code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && code.length === 4) {
      setPendingJoinCode(code.toUpperCase());
      setView('join');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auto-fill join code when authenticated if there was a pending code
  useEffect(() => {
    if (isAuthenticated && pendingJoinCode) {
      setRoomCode(pendingJoinCode);
      setPendingJoinCode(null);
    }
  }, [isAuthenticated, pendingJoinCode]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || roomCode.length !== 4) return;
    joinRoom(roomCode, name.trim());
  };

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col pt-16">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="mb-4 font-mono text-primary leading-tight" style={{
            textShadow: '0 0 10px rgba(0, 240, 255, 0.8), 0 0 20px rgba(0, 240, 255, 0.5)'
          }}>
            <pre className="inline-block text-left text-xs sm:text-sm">
{`╔═══════════════════════╗
║     SPOTIFIGHT        ║
╚═══════════════════════╝`}
            </pre>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary"></div>
            <div className="text-secondary text-xs uppercase tracking-[0.2em]">SYNC MODE</div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
          <p className="text-text-muted text-sm tracking-wide font-mono">
            &gt; CONNECT_HEADPHONES :: PLAY_TOGETHER
          </p>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="bg-warning/10 border border-warning text-warning text-sm text-center py-2 px-4 rounded-lg mb-6 uppercase tracking-wide">
            &gt; Connecting to server...
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-secondary/10 border border-secondary text-secondary text-sm text-center py-2 px-4 rounded-lg mb-6 uppercase tracking-wide">
            ! {error}
            <button onClick={clearError} className="ml-2 underline hover:text-primary transition-colors">
              [X]
            </button>
          </div>
        )}

        {/* Spotify Authentication Required */}
        {!isAuthenticated && (
          <div className="space-y-4">
            <div className="bg-bg-card border-2 border-primary/30 rounded-lg p-6 text-center">
              <div className="text-text-muted text-sm mb-4 font-mono uppercase tracking-wide">
                &gt; Authentication Required
              </div>
              <p className="text-text-muted text-xs mb-6">
                Link your Spotify Premium account to join the party
              </p>
              <button
                onClick={() => startSpotifyAuth(pendingJoinCode || undefined)}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:shadow-[0_0_30px_rgba(29,185,84,0.6)]"
              >
                <span>&gt; Connect Spotify</span>
              </button>
            </div>
          </div>
        )}

        {/* Player Initializing */}
        {isAuthenticated && !isPlayerReady && (
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning text-warning text-sm text-center py-3 px-4 rounded-lg font-mono uppercase tracking-wide">
              {isPremium === false
                ? '! Premium Required - Please upgrade your account'
                : '&gt;&gt; Initializing Audio Stream...'}
            </div>
          </div>
        )}

        {/* Ready - Show Create/Join Options */}
        {isPlayerReady && (
          <>
            <div className="bg-success/10 border border-success text-success text-sm text-center py-2 px-4 rounded-lg mb-4 font-mono uppercase tracking-wide relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-success/20 to-transparent animate-pulse"></div>
              <span className="relative z-10">[OK] STREAM ACTIVE :: READY</span>
            </div>

            {/* Name input */}
            <div className="mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="&gt; ENTER YOUR NAME"
                maxLength={20}
                className="w-full bg-bg-card border-2 border-primary/50 rounded-lg px-4 py-3 text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all uppercase tracking-wider"
              />
            </div>

            {view === 'home' ? (
              <div className="space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || !isConnected}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
                >
                  &gt; Create Game
                </button>
                <button
                  onClick={() => setView('join')}
                  disabled={!isConnected}
                  className="w-full bg-transparent hover:bg-bg-hover border-2 border-primary disabled:opacity-40 disabled:cursor-not-allowed text-primary font-bold py-4 rounded-lg text-lg transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] uppercase tracking-wider"
                >
                  &gt; Join Game
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="XXXX"
                  maxLength={4}
                  className="w-full bg-bg-card border-2 border-secondary/50 rounded-lg px-4 py-3 text-2xl text-center font-mono tracking-[0.5em] text-primary placeholder:text-text-muted placeholder:tracking-normal focus:outline-none focus:border-secondary transition-all"
                  style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}
                />
                <button
                  onClick={handleJoin}
                  disabled={!name.trim() || roomCode.length !== 4 || !isConnected}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
                >
                  &gt; Join
                </button>
                <button
                  onClick={() => { setView('home'); setRoomCode(''); clearError(); }}
                  className="w-full text-text-muted hover:text-primary py-2 text-sm transition-colors uppercase tracking-wide"
                >
                  &lt; Back
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted py-4 uppercase tracking-widest">
        [ Requires Spotify Premium ]
      </div>
    </MobileShell>
  );
}
