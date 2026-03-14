import { useState } from 'react';
import { GamePhase } from 'shared/src/types';
import { useDevControls } from './DevProvider';

const PHASES: { key: GamePhase; label: string }[] = [
  { key: GamePhase.LOBBY, label: 'LOB' },
  { key: GamePhase.COUNTDOWN, label: 'CDN' },
  { key: GamePhase.PLAYING, label: 'PLY' },
  { key: GamePhase.REVEAL, label: 'REV' },
  { key: GamePhase.RESULTS, label: 'RES' },
  { key: GamePhase.GAME_OVER, label: 'GG' },
];

export function DevPanel() {
  const { state, setPhase, setPlayerCount, setIsHost, setRoundNumber, setRoundLimit } = useDevControls();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-primary text-bg-primary font-bold text-sm flex items-center justify-center shadow-lg"
        style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)' }}
      >
        D
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-72 bg-[#0d0d1a] border border-primary/40 rounded-xl p-4 font-mono text-xs shadow-2xl"
      style={{ boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-primary/20">
        <span className="text-primary font-bold text-sm tracking-wide">DEV MODE</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-text-muted hover:text-primary transition-colors"
        >
          [_]
        </button>
      </div>

      {/* Phase selector */}
      <div className="mb-3">
        <div className="text-text-muted mb-1.5 uppercase tracking-wider text-[10px]">Phase</div>
        <div className="grid grid-cols-6 gap-1">
          {PHASES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPhase(key)}
              className={`py-1.5 rounded text-[10px] transition-all ${
                state.phase === key
                  ? 'bg-primary text-bg-primary font-bold'
                  : 'bg-bg-card border border-primary/20 text-text-muted hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Player count */}
      <div className="mb-3">
        <div className="text-text-muted mb-1.5 uppercase tracking-wider text-[10px]">
          Players: <span className="text-primary">{state.playerCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayerCount(Math.max(2, state.playerCount - 1))}
            className="w-8 h-8 rounded bg-bg-card border border-primary/20 text-primary hover:border-primary/50 transition-all flex items-center justify-center"
          >
            -
          </button>
          <input
            type="range"
            min={2}
            max={20}
            value={state.playerCount}
            onChange={e => setPlayerCount(Number(e.target.value))}
            className="flex-1 accent-[#00f0ff]"
          />
          <button
            onClick={() => setPlayerCount(Math.min(20, state.playerCount + 1))}
            className="w-8 h-8 rounded bg-bg-card border border-primary/20 text-primary hover:border-primary/50 transition-all flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Round info */}
      <div className="mb-3 flex gap-3">
        <div className="flex-1">
          <div className="text-text-muted mb-1.5 uppercase tracking-wider text-[10px]">Round</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRoundNumber(Math.max(1, state.roundNumber - 1))}
              className="w-7 h-7 rounded bg-bg-card border border-primary/20 text-primary hover:border-primary/50 transition-all flex items-center justify-center"
            >
              -
            </button>
            <span className="text-primary w-6 text-center">{state.roundNumber}</span>
            <button
              onClick={() => setRoundNumber(Math.min(state.roundLimit, state.roundNumber + 1))}
              className="w-7 h-7 rounded bg-bg-card border border-primary/20 text-primary hover:border-primary/50 transition-all flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-text-muted mb-1.5 uppercase tracking-wider text-[10px]">Limit</div>
          <div className="flex gap-1">
            {[3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => {
                  setRoundLimit(n);
                  if (state.roundNumber > n) setRoundNumber(n);
                }}
                className={`flex-1 py-1 rounded text-[11px] transition-all ${
                  state.roundLimit === n
                    ? 'bg-primary/20 border border-primary text-primary'
                    : 'bg-bg-card border border-primary/20 text-text-muted hover:border-primary/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Host toggle */}
      <div className="flex items-center justify-between">
        <span className="text-text-muted uppercase tracking-wider text-[10px]">View as</span>
        <div className="flex gap-1">
          <button
            onClick={() => setIsHost(true)}
            className={`px-3 py-1 rounded text-[11px] transition-all ${
              state.isHost
                ? 'bg-primary/20 border border-primary text-primary'
                : 'bg-bg-card border border-primary/20 text-text-muted hover:border-primary/50'
            }`}
          >
            Host
          </button>
          <button
            onClick={() => setIsHost(false)}
            className={`px-3 py-1 rounded text-[11px] transition-all ${
              !state.isHost
                ? 'bg-primary/20 border border-primary text-primary'
                : 'bg-bg-card border border-primary/20 text-text-muted hover:border-primary/50'
            }`}
          >
            Guest
          </button>
        </div>
      </div>
    </div>
  );
}
