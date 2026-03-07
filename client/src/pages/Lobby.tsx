import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';
import { useSpotify } from '../context/SpotifyContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { PlayerCard } from '../components/room/PlayerCard';

export function Lobby() {
  const { room, playerId, isHost, startGame } = useGame();
  const { isAuthenticated, isPlayerReady, deviceId, isPremium } = useSpotify();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);

  // Notify server when ready (with or without Spotify)
  useEffect(() => {
    if (!socket) return;

    if (isPlayerReady && deviceId) {
      // Host with Spotify authentication
      socket.emit('player:ready', { spotifyDeviceId: deviceId });
    } else if (!isAuthenticated) {
      // Guest without Spotify - still mark as ready
      socket.emit('player:ready', {});
    }
  }, [isAuthenticated, isPlayerReady, deviceId, socket]);

  if (!room) return null;

  const joinUrl = `${window.location.origin}?code=${room.code}`;
  const canStart = room.players.length >= 2;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <MobileShell>
      <Header />

      {/* QR Code + Room Code */}
      <div className="mb-4">
        <div className="flex items-center gap-5 mb-3">
          <div className="bg-white p-3 rounded-lg shrink-0 relative" style={{
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
          }}>
            <QRCodeSVG value={joinUrl} size={100} level="M" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" style={{
              boxShadow: '0 0 10px rgba(57, 255, 20, 0.8)'
            }}></div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1 uppercase tracking-wider font-mono">&gt; Access Code</div>
            <div className="font-mono text-3xl font-bold tracking-[0.25em] text-primary neon-text">
              {room.code}
            </div>
            <div className="text-xs text-text-muted mt-1 font-mono">
              // Scan or share link
            </div>
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={copyLink}
          className="w-full bg-bg-card hover:bg-bg-hover border-2 border-primary/30 hover:border-primary/50 text-primary font-bold py-3 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] uppercase tracking-wider text-sm font-mono flex items-center justify-center gap-2"
        >
          {copied ? (
            <span>[OK] Link Copied</span>
          ) : (
            <span>&gt; Copy Invite Link</span>
          )}
        </button>
      </div>

      {/* Status Display */}
      {!isAuthenticated ? (
        <div className="bg-primary/10 border border-primary text-primary text-sm text-center py-2 px-4 rounded-lg mb-4 font-mono uppercase tracking-wide relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse"></div>
          <span className="relative z-10">&gt; GUEST MODE :: READY</span>
        </div>
      ) : !isPlayerReady ? (
        <div className="bg-warning/10 border border-warning text-warning text-sm text-center py-2 px-4 rounded-lg mb-4 font-mono uppercase tracking-wide">
          {isPremium === false
            ? '! Premium Required'
            : '&gt;&gt; Initializing Audio Stream...'}
        </div>
      ) : (
        <div className="bg-success/10 border border-success text-success text-sm text-center py-2 px-4 rounded-lg mb-4 font-mono uppercase tracking-wide relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-success/20 to-transparent animate-pulse"></div>
          <span className="relative z-10">[OK] STREAM ACTIVE :: READY</span>
        </div>
      )}

      {/* Player List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="text-sm text-text-muted mb-3 font-mono uppercase tracking-wider flex items-center gap-2">
          <span className="text-primary">&gt;&gt;</span>
          <span>Connected Users [{room.players.length}]</span>
        </div>
        <div className="space-y-2">
          {room.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === playerId}
            />
          ))}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="shrink-0 pt-4 pb-2">
        {isHost ? (
          <>
            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
            >
              {canStart
                ? `&gt;&gt; Initialize Game [${room.players.length}]`
                : '&gt; Awaiting Players...'}
            </button>
            {!canStart && (
              <div className="text-xs text-text-muted text-center mt-2 font-mono">
                // Minimum 2 users required
              </div>
            )}
          </>
        ) : (
          <div className="bg-bg-card border-2 border-primary/30 rounded-lg py-4 px-6 text-center">
            <div className="text-text-muted font-mono uppercase tracking-wide">
              &gt;&gt; Standby :: Awaiting Host Command
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
