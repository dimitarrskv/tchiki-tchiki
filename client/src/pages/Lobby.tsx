import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { PlayerCard } from '../components/room/PlayerCard';

interface LogEntry {
  id: number;
  type: 'sys' | 'join' | 'leave';
  text: string;
}

let logId = 0;

export function Lobby() {
  const { room, playerId, isHost, startGame, setRoundLimit } = useGame();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    { id: logId++, type: 'sys', text: 'scan QR to join' },
    { id: logId++, type: 'sys', text: 'or share the link' },
  ]);
  const prevPlayerIdsRef = useRef<Set<string>>(new Set());
  const logEndRef = useRef<HTMLDivElement>(null);

  // Notify server when ready
  useEffect(() => {
    if (!socket) return;
    socket.emit('player:ready', {});
  }, [socket]);

  // Track player joins/leaves
  useEffect(() => {
    if (!room) return;
    const currentIds = new Set(room.players.map(p => p.id));
    const prevIds = prevPlayerIdsRef.current;

    // Detect joins
    for (const player of room.players) {
      if (!prevIds.has(player.id)) {
        setLogs(prev => [...prev, { id: logId++, type: 'join', text: `${player.name} joined` }]);
      }
    }

    // Detect leaves
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        setLogs(prev => [...prev, { id: logId++, type: 'leave', text: 'player left' }]);
      }
    }

    prevPlayerIdsRef.current = currentIds;
  }, [room?.players]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!room) return null;

  const joinUrl = `${window.location.origin}?code=${room.code}`;
  const canStart = room.players.length >= 4;

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

      {/* QR Code + Console */}
      <div className="mb-4 flex items-stretch gap-3">
        {/* QR + Copy */}
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
          <button
            onClick={copyLink}
            className="w-full bg-bg-card hover:bg-bg-hover border border-primary/30 hover:border-primary/50 text-primary py-1.5 rounded-lg transition-all text-xs font-mono flex items-center justify-center"
          >
            {copied ? '[OK] Copied' : 'Copy Link'}
          </button>
        </div>

        {/* Live Console */}
        <div className="flex-1 min-w-0 bg-black/40 border border-primary/10 rounded-lg p-3 font-mono text-[11px] backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            <div className="text-primary/50 uppercase tracking-wider text-[9px]">Live Log</div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[100px]">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-1.5">
                <span className={
                  log.type === 'sys' ? 'text-primary/50' :
                  log.type === 'join' ? 'text-success' :
                  'text-warning'
                }>
                  {log.type === 'sys' ? '[SYS]' : log.type === 'join' ? '[+]' : '[-]'}
                </span>
                <span className={
                  log.type === 'join' ? 'text-success' :
                  log.type === 'leave' ? 'text-warning' :
                  'text-text-muted'
                }>
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="text-sm text-text-muted mb-3 font-mono uppercase tracking-wider flex items-center gap-2 shrink-0">
        <span className="text-primary">{'>>'}</span>
        <span>Players [{room.players.length}]</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
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
            {/* Round Limit Selector */}
            <div className="mb-3">
              <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wide">
                {'>'} Rounds
              </div>
              <div className="flex gap-2">
                {[5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setRoundLimit(n)}
                    className={`flex-1 py-2 rounded-lg font-mono text-sm transition-all border-2 ${
                      room.roundLimit === n
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-bg-card border-primary/30 text-text-muted hover:border-primary/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-bold py-4 rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] uppercase tracking-wider"
            >
              {canStart
                ? `>> Start Game [${room.players.length}]`
                : '> Waiting for players...'}
            </button>
            {!canStart && (
              <div className="text-xs text-text-muted text-center mt-2 font-mono">
                // min 4 players
              </div>
            )}
          </>
        ) : (
          <div className="bg-bg-card border-2 border-primary/30 rounded-lg py-4 px-6 text-center">
            <div className="text-text-muted font-mono uppercase tracking-wide">
              {'>> Waiting for host...'}
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
