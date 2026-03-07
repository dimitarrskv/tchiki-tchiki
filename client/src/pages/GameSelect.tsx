import { GameMode } from 'shared/src/types';
import { useGame } from '../context/GameContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { clsx } from 'clsx';

interface ModeInfo {
  mode: GameMode;
  name: string;
  icon: string;
  description: string;
  playerHint: string;
}

const MODES: ModeInfo[] = [
  {
    mode: GameMode.ODD_ONE_OUT,
    name: 'Odd One Out',
    icon: '◬',
    description: "Everyone hears music except one faker who must pretend. Find the faker!",
    playerHint: '4+ players recommended',
  },
  {
    mode: GameMode.MUSIC_PAIRS,
    name: 'Music Pairs',
    icon: '◈',
    description: 'Each pair hears the same song. Find your match by dancing and vibing!',
    playerHint: 'Even number of players',
  },
  {
    mode: GameMode.FREEZE,
    name: 'Freeze',
    icon: '◉',
    description: "Dance to the music. When YOUR song stops, freeze! Don't get caught moving.",
    playerHint: '4+ players recommended',
  },
];

export function GameSelect() {
  const { isHost, selectMode } = useGame();

  return (
    <MobileShell>
      <Header />

      <div className="flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary text-lg">&gt;&gt;</div>
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              {isHost ? 'Select Protocol' : 'Standby Mode'}
            </h2>
          </div>
          <p className="text-text-muted text-sm font-mono">
            {isHost
              ? '// Initialize game mode sequence'
              : '// Awaiting host transmission...'}
          </p>
        </div>

        <div className="space-y-3">
          {MODES.map((mode) => (
            <button
              key={mode.mode}
              onClick={() => isHost && selectMode(mode.mode)}
              disabled={!isHost}
              className={clsx(
                'w-full text-left p-5 rounded-lg border-2 transition-all relative overflow-hidden',
                isHost
                  ? 'bg-bg-card border-primary/30 hover:border-primary hover:bg-bg-hover cursor-pointer hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                  : 'bg-bg-card border-border/30 opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className="text-4xl font-bold text-primary neon-text" style={{
                  textShadow: '0 0 10px rgba(0, 240, 255, 0.8)'
                }}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg uppercase tracking-wide text-primary">
                    {mode.name}
                  </div>
                  <div className="text-sm text-text-muted mt-1 leading-relaxed">
                    {mode.description}
                  </div>
                  <div className="text-xs text-secondary mt-2 uppercase tracking-wide">
                    &gt; {mode.playerHint}
                  </div>
                </div>
              </div>
              {isHost && (
                <div className="absolute top-2 right-2 text-xs text-primary/50 font-mono">
                  [SELECT]
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
