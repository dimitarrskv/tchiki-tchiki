import { clsx } from 'clsx';
import type { PlayerInfo } from 'shared/src/types';
import { PlayerRole } from 'shared/src/types';

interface PlayerCardProps {
  player: PlayerInfo;
  isMe: boolean;
}

const AVATARS = ['◆', '◇', '◈', '◉', '◊', '○', '◐', '◑', '◒', '◓', '●', '◮'];
const AVATAR_COLORS = [
  '#00f0ff', // cyan
  '#ff006e', // pink
  '#9d4edd', // purple
  '#39ff14', // green
  '#ffbe0b', // yellow
  '#00d9ff', // light cyan
  '#ff6b9d', // light pink
  '#b47ede', // light purple
];

function getAvatar(name: string): { symbol: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const symbol = AVATARS[Math.abs(hash) % AVATARS.length];
  const color = AVATAR_COLORS[Math.abs(hash >> 8) % AVATAR_COLORS.length];
  return { symbol, color };
}

export function PlayerCard({ player, isMe }: PlayerCardProps) {
  const avatar = getAvatar(player.name);
  const isGuest = player.role === PlayerRole.GUEST;

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all border-2',
        isMe ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-bg-card border-primary/20',
        !player.isConnected && 'opacity-50'
      )}
    >
      <div
        className="text-2xl font-bold flex items-center justify-center w-10 h-10 rounded-lg border-2"
        style={{
          color: avatar.color,
          borderColor: avatar.color,
          textShadow: `0 0 10px ${avatar.color}`,
          boxShadow: `0 0 10px ${avatar.color}40`
        }}
      >
        {avatar.symbol}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate uppercase tracking-wide">{player.name}</span>
          {isMe && (
            <span className="text-xs text-primary font-mono">[YOU]</span>
          )}
          {player.isHost && (
            <span className="text-xs bg-secondary/30 text-secondary border border-secondary/50 px-2 py-0.5 rounded font-mono">
              HOST
            </span>
          )}
          {isGuest && (
            <span className="text-xs bg-border/30 text-text-muted border border-border/50 px-2 py-0.5 rounded font-mono">
              GUEST
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted font-mono">
          {!player.isConnected
            ? '// Reconnecting...'
            : player.isReady
            ? isGuest ? '&gt; Ready' : '&gt; Stream active'
            : isGuest ? '&gt; Connecting...' : '&gt; Linking stream...'}
        </div>
      </div>
      <div
        className={clsx(
          'w-3 h-3 rounded-full',
          !player.isConnected
            ? 'bg-warning animate-pulse'
            : player.isReady
            ? 'bg-success'
            : 'bg-border'
        )}
        style={{
          boxShadow: player.isReady
            ? '0 0 10px rgba(57, 255, 20, 0.8)'
            : !player.isConnected
            ? '0 0 10px rgba(255, 190, 11, 0.8)'
            : 'none'
        }}
      />
    </div>
  );
}
