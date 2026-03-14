import { useGame } from '../../context/GameContext';
import { GamePhase } from 'shared/src/types';

export function Header() {
  const { room, leaveRoom } = useGame();

  if (!room) return null;

  const isInGame = room.phase !== GamePhase.LOBBY && room.phase !== GamePhase.GAME_OVER;

  const handleLeave = () => {
    if (isInGame) {
      const confirmed = window.confirm('Leave the game? This will remove you from the current round.');
      if (!confirmed) return;
    }
    leaveRoom();
  };

  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary/20">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-mono text-lg font-bold tracking-widest text-primary uppercase">
            {room.code}
          </div>
          <div className="text-xs text-text-muted font-mono">
            {'>'} {room.players.length} user{room.players.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <button
        onClick={handleLeave}
        className="text-sm text-text-muted hover:text-secondary transition-colors px-3 py-1 rounded-lg hover:bg-bg-hover border border-transparent hover:border-secondary/30 font-mono uppercase tracking-wide"
      >
        [Exit]
      </button>
    </header>
  );
}
