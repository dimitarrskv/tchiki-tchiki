import { useEffect, useRef } from 'react';
import { playCountdownTick } from '../lib/audio';

/**
 * Hook to play countdown sounds via HTML Audio.
 * Each tick is a lighter version of the times-up sound,
 * escalating in intensity: 3 (lightest) → 2 → 1 (heaviest) → times-up.
 */
export function useCountdownSound(countdown: number, isCountdownPhase: boolean) {
  const hasPlayedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (countdown >= 1 && countdown <= 3 && !hasPlayedRef.current.has(countdown)) {
      playCountdownTick(countdown);
      hasPlayedRef.current.add(countdown);
    }

    if (!isCountdownPhase) {
      hasPlayedRef.current.clear();
    }
  }, [countdown, isCountdownPhase]);
}
