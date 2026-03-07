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
    const isGuest = !isAuthenticated;
    joinRoom(roomCode, name.trim(), isGuest);
  };

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col pt-16">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          {/* Pixelated SPOTIFIGHT Logo */}
          <div className="mb-6 flex justify-center">
            <div className="font-mono text-primary leading-[0.9]" style={{
              textShadow: '0 0 15px rgba(30, 215, 96, 0.9), 0 0 30px rgba(30, 215, 96, 0.6), 0 0 45px rgba(30, 215, 96, 0.3)'
            }}>
              <pre className="inline-block text-left text-[6px] sm:text-[8px]">
{`███████╗██████╗  ██████╗ ████████╗██╗███████╗██╗ ██████╗ ██╗  ██╗████████╗
██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝██║██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝
███████╗██████╔╝██║   ██║   ██║   ██║█████╗  ██║██║  ███╗███████║   ██║
╚════██║██╔═══╝ ██║   ██║   ██║   ██║██╔══╝  ██║██║   ██║██╔══██║   ██║
███████║██║     ╚██████╔╝   ██║   ██║██║     ██║╚██████╔╝██║  ██║   ██║
╚══════╝╚═╝      ╚═════╝    ╚═╝   ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝`}
              </pre>
            </div>
          </div>

          <p className="text-text-muted text-sm tracking-wide font-mono">
            &gt; CONNECT_HEADPHONES :: PLAY_TOGETHER
          </p>
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
                {isConnected ? '✓ Server connected' : '◌ Connecting to server...'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary/50">[AUTH]</span>
              <span className={isAuthenticated ? 'text-success' : 'text-text-muted/50'}>
                {isAuthenticated ? '✓ Spotify authenticated' : '○ Awaiting authentication'}
              </span>
            </div>
            {isAuthenticated && (
              <div className="flex items-start gap-2">
                <span className="text-primary/50">[STREAM]</span>
                <span className={isPlayerReady ? 'text-success' : 'text-warning'}>
                  {isPlayerReady
                    ? '✓ Audio stream active'
                    : isPremium === false
                      ? '✗ Premium account required'
                      : '◌ Initializing stream...'}
                </span>
              </div>
            )}
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
          {isPlayerReady && (
            <div className="mt-3 pt-3 border-t border-success/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-success text-sm uppercase tracking-wider">Ready for battle</span>
            </div>
          )}
        </div>

        {/* Spotify Authentication Required for Host */}
        {!isAuthenticated && view === 'home' && (
          <div className="space-y-4">
            <button
              onClick={() => startSpotifyAuth(pendingJoinCode || undefined)}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:shadow-[0_0_30px_rgba(29,185,84,0.6)]"
            >
              <span>&gt; Connect Spotify</span>
            </button>
            <p className="text-text-muted text-xs text-center">
              Link your Spotify Premium account to host a game
            </p>
            <button
              onClick={() => setView('join')}
              disabled={!isConnected}
              className="w-full bg-transparent hover:bg-bg-hover border-2 border-primary disabled:opacity-40 disabled:cursor-not-allowed text-primary font-bold py-4 rounded-lg text-lg transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] uppercase tracking-wider"
            >
              &gt; Join as Guest
            </button>
          </div>
        )}

        {/* Guest Join - No Authentication Required */}
        {!isAuthenticated && view === 'join' && (
          <>
            <div className="bg-bg-card border-2 border-primary/30 rounded-lg p-4 mb-6 font-mono text-xs">
              <p className="text-text-muted text-sm mb-2">
                &gt; Joining as <span className="text-primary">GUEST</span>
              </p>
              <p className="text-text-muted text-xs">
                No Spotify authentication needed. The host will play music.
              </p>
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
                &gt; Join as Guest
              </button>
              <button
                onClick={() => { setView('home'); setRoomCode(''); clearError(); }}
                className="w-full text-text-muted hover:text-primary py-2 text-sm transition-colors uppercase tracking-wide"
              >
                &lt; Back
              </button>
            </div>
          </>
        )}

        {/* Player Initializing - Show message */}
        {isAuthenticated && !isPlayerReady && isPremium === false && (
          <div className="text-center text-warning text-sm uppercase tracking-wide">
            ! Please upgrade to Spotify Premium
          </div>
        )}

        {/* Ready - Show Create/Join Options */}
        {isPlayerReady && (
          <>
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
        [ Creator Requires Spotify Premium ]
      </div>
    </MobileShell>
  );
}
