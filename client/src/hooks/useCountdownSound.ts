import { useEffect, useRef } from 'react';

/**
 * Hook to play countdown beep sounds using Web Audio API
 */
export function useCountdownSound(countdown: number, isCountdownPhase: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasPlayedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Initialize AudioContext once
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      // Cleanup on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Play beep for countdown numbers 3, 2, 1 (check this BEFORE checking phase)
    if (countdown >= 1 && countdown <= 3 && !hasPlayedRef.current.has(countdown)) {
      playBeep(countdown);
      hasPlayedRef.current.add(countdown);
    }

    // Reset when not in countdown phase
    if (!isCountdownPhase) {
      hasPlayedRef.current.clear();
    }
  }, [countdown, isCountdownPhase]);

  const playBeep = (count: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      // Create oscillator for beep sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different frequencies for different countdown numbers
      // 3 = lower pitch, 2 = medium, 1 = higher pitch
      const frequency = count === 3 ? 440 : count === 2 ? 554 : 659;
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Volume envelope
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      // Play the beep
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (err) {
      console.warn('Failed to play countdown beep:', err);
    }
  };
}
