import { useEffect, useRef, useState } from 'react';

/**
 * Hook to prevent phone screen from sleeping during gameplay
 * Uses Wake Lock API with fallback to silent audio trick
 */
export function useWakeLock(enabled: boolean = false) {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) {
      release();
      return;
    }

    acquire();

    // Re-acquire on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      release();
    };
  }, [enabled]);

  const acquire = async () => {
    try {
      // Try Wake Lock API first (Chrome, Edge, Safari 16.4+)
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsActive(true);
        console.log('Wake lock acquired');

        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake lock released');
          setIsActive(false);
        });
      } else {
        // Fallback: silent audio to prevent sleep (older browsers)
        useSilentAudioFallback();
      }
    } catch (err: any) {
      console.warn('Wake lock failed, using audio fallback:', err);
      useSilentAudioFallback();
    }
  };

  const release = () => {
    // Release wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }

    // Stop audio fallback
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsActive(false);
  };

  const useSilentAudioFallback = () => {
    try {
      // Create inaudible audio to keep browser active
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Make it completely silent
      gainNode.gain.value = 0.001;
      oscillator.frequency.value = 20000; // Inaudible frequency

      oscillator.start();
      audioContextRef.current = audioContext;
      setIsActive(true);

      console.log('Using silent audio fallback to prevent sleep');
    } catch (err) {
      console.error('Audio fallback failed:', err);
    }
  };

  return { isActive, acquire, release };
}
