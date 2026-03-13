import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { PlayerCard } from '../components/room/PlayerCard';

export function Lobby() {
  const { room, playerId, isHost, startGame } = useGame();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Notify server when ready
  useEffect(() => {
    if (!socket) return;
    socket.emit('player:ready', {});
  }, [socket]);

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
        <div className="flex items-start gap-5">
          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="bg-white p-3 rounded-lg relative cursor-pointer hover:scale-105 transition-transform"
              style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
            >
              <QRCodeSVG value={joinUrl} size={100} level="M" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" style={{
                boxShadow: '0 0 10px rgba(57, 255, 20, 0.8)'
              }}></div>
            </button>
            {/* Copy Link Button */}
            <button
              onClick={copyLink}
              className="w-full bg-bg-card hover:bg-bg-hover border border-primary/30 hover:border-primary/50 text-primary py-1.5 rounded-lg transition-all text-xs font-mono flex items-center justify-center"
            >
              {copied ? '[OK] Copied' : 'Copy Link'}
            </button>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1 uppercase tracking-wider font-mono">{'>'} Access Code</div>
            <div className="font-mono text-3xl font-bold tracking-[0.25em] text-primary neon-text">
              {room.code}
            </div>
            <div className="text-xs text-text-muted mt-1 font-mono">
              // Scan or share link
            </div>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="text-sm text-text-muted mb-3 font-mono uppercase tracking-wider flex items-center gap-2">
          <span className="text-primary">{'>>'}</span>
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
                ? `>> Initialize Game [${room.players.length}]`
                : '> Awaiting Players...'}
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
              {'>> Standby :: Awaiting Host Command'}
            </div>
          </div>
        )}
      </div>
      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowQR(false)}
        >
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-2xl" style={{
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.4)'
            }}>
              <QRCodeSVG value={joinUrl} size={250} level="M" />
            </div>
            <div className="font-mono text-4xl font-bold tracking-[0.3em] text-primary neon-text">
              {room.code}
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="text-text-muted hover:text-primary text-sm font-mono uppercase tracking-wide transition-colors"
            >
              [close]
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
