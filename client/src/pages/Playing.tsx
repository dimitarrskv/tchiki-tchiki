import { useGame } from '../context/GameContext';
import { MobileShell } from '../components/layout/MobileShell';
import { Header } from '../components/layout/Header';
import { GamePhase } from 'shared/src/types';

export function Playing() {
  const { room } = useGame();

  if (!room) return null;

  return (
    <MobileShell>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {room.phase === GamePhase.COUNTDOWN && (
          <div>
            <div className="text-6xl font-bold text-primary animate-pulse mb-4">
              Get Ready!
            </div>
            <p className="text-text-muted">Put your headphones on...</p>
          </div>
        )}

        {room.phase === GamePhase.PLAYING && (
          <div>
            <div className="text-2xl font-bold mb-2">Listening...</div>
            <p className="text-text-muted">
              {room.currentMode === 'odd-one-out'
                ? 'Vibe to the music. Can you spot the faker?'
                : room.currentMode === 'music-pairs'
                ? 'Find the person hearing your song!'
                : 'Dance! Freeze when your music stops!'}
            </p>
          </div>
        )}

        {room.phase === GamePhase.VOTING && (
          <div className="w-full">
            <div className="text-2xl font-bold mb-4">Who is the Faker?</div>
            <p className="text-text-muted mb-6">Vote now!</p>
            {/* Voting UI will be built in Milestone 3 */}
            <div className="text-text-muted text-sm">
              Voting UI coming in Milestone 3
            </div>
          </div>
        )}

        {(room.phase === GamePhase.REVEAL || room.phase === GamePhase.RESULTS) && (
          <div>
            <div className="text-4xl font-bold mb-4">Results</div>
            {/* Results UI will be built in Milestone 3 */}
            <div className="text-text-muted text-sm">
              Results UI coming in Milestone 3
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
