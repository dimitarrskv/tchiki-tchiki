import { useEffect, useRef } from 'react';
import { getContext } from '../lib/audio';

/**
 * Hook to play countdown sounds using the shared Web Audio API context.
 * Reuses the AudioContext from audio.ts so it's already unlocked by user gesture.
 * Warm electronic "kick" that builds tension: low → mid → high.
 */
export function useCountdownSound(countdown: number, isCountdownPhase: boolean) {
  const hasPlayedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (countdown >= 1 && countdown <= 3 && !hasPlayedRef.current.has(countdown)) {
      playTick(countdown);
      hasPlayedRef.current.add(countdown);
    }

    if (!isCountdownPhase) {
      hasPlayedRef.current.clear();
    }
  }, [countdown, isCountdownPhase]);

  const playTick = (count: number) => {
    try {
      const ctx = getContext();
      ctx.resume().catch(() => {});

      const now = ctx.currentTime;

      // Ascending pitch builds anticipation: 3 → 1
      const freq = count === 3 ? 300 : count === 2 ? 500 : 800;

      // Main tone — triangle wave for warmth
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.06);

      // Sub layer for body
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq * 0.5, now);

      // Filter to shape the tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);
      filter.frequency.exponentialRampToValueAtTime(freq, now + 0.1);
      filter.Q.value = 2;

      // Volume envelope — punchy attack, quick decay
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      // Routing
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
      sub.start(now);
      sub.stop(now + 0.18);
    } catch (err) {
      console.warn('Failed to play countdown sound:', err);
    }
  };
}
