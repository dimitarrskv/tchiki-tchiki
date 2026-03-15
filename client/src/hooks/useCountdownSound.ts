import { useEffect, useRef } from 'react';
import { playCountdownTick } from '../lib/audio';

/**
 * Hook to play countdown sounds via HTML Audio.
 * Ascending pitch builds tension: low → mid → high.
 */
export function useCountdownSound(countdown: number, isCountdownPhase: boolean) {
  const hasPlayedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (countdown >= 1 && countdown <= 3 && !hasPlayedRef.current.has(countdown)) {
      const freq = countdown === 3 ? 300 : countdown === 2 ? 500 : 800;
      playCountdownTick(freq);
      hasPlayedRef.current.add(countdown);
    }

    if (!isCountdownPhase) {
      hasPlayedRef.current.clear();
    }
  }, [countdown, isCountdownPhase]);
}
