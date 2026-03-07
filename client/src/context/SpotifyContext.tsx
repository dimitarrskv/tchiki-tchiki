import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import {
  getStoredTokens,
  isTokenExpired,
  refreshSpotifyToken,
  startPlayback,
  pausePlayback,
  seekToPosition,
  clearTokens,
  SpotifyTokens,
} from '../lib/spotify';

// Spotify SDK types
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<any>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
}

interface SpotifyContextValue {
  isAuthenticated: boolean;
  isPlayerReady: boolean;
  isPremium: boolean | null;
  deviceId: string | null;
  accessToken: string | null;
  play: (trackUri: string) => Promise<void>;
  pause: () => Promise<void>;
  logout: () => void;
  getPlaybackPosition: () => Promise<number | null>;
  syncPlayback: (targetPositionMs: number) => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextValue>({
  isAuthenticated: false,
  isPlayerReady: false,
  isPremium: null,
  deviceId: null,
  accessToken: null,
  play: async () => {},
  pause: async () => {},
  logout: () => {},
  getPlaybackPosition: async () => null,
  syncPlayback: async () => {},
});

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(getStoredTokens);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const isAuthenticated = !!tokens && !isTokenExpired(tokens);

  // ─── Token Refresh ─────────────────────────────────────

  const scheduleRefresh = useCallback((tokens: SpotifyTokens) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const msUntilExpiry = tokens.expiresAt - Date.now() - 120_000; // Refresh 2 min before expiry
    if (msUntilExpiry <= 0) {
      // Already near expiry, refresh now
      refreshSpotifyToken(tokens.refreshToken)
        .then((newTokens) => {
          setTokens(newTokens);
          scheduleRefresh(newTokens);
        })
        .catch(() => {
          console.error('Token refresh failed');
          setTokens(null);
          clearTokens();
        });
      return;
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshSpotifyToken(tokens.refreshToken)
        .then((newTokens) => {
          setTokens(newTokens);
          scheduleRefresh(newTokens);
        })
        .catch(() => {
          console.error('Token refresh failed');
          setTokens(null);
          clearTokens();
        });
    }, msUntilExpiry);
  }, []);

  // ─── Initialize SDK Player ─────────────────────────────

  useEffect(() => {
    if (!tokens || isTokenExpired(tokens)) return;

    scheduleRefresh(tokens);

    // Load the Spotify Web Playback SDK script
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Initialize player when SDK is ready
    const initPlayer = () => {
      if (playerRef.current) return;

      const player = new window.Spotify.Player({
        name: 'Tchiki-Tchiki',
        getOAuthToken: (cb) => {
          const current = getStoredTokens();
          if (current) {
            cb(current.accessToken);
          }
        },
        volume: 0.8,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Player ready, device_id:', device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      player.addListener('not_ready', () => {
        console.log('Spotify Player not ready');
        setIsPlayerReady(false);
        setDeviceId(null);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Spotify init error:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Spotify auth error:', message);
        setTokens(null);
        clearTokens();
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Spotify account error (Premium required?):', message);
        setIsPremium(false);
      });

      player.connect().then((success) => {
        if (success) {
          console.log('Spotify Player connected');
          setIsPremium(true);
        }
      });

      playerRef.current = player;
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [tokens, scheduleRefresh]);

  // ─── Playback Controls ─────────────────────────────────

  const play = useCallback(async (trackUri: string) => {
    const current = getStoredTokens();
    if (!current || !deviceId) {
      console.error('Cannot play: not authenticated or no device');
      return;
    }
    await startPlayback(current.accessToken, deviceId, trackUri);
  }, [deviceId]);

  const pause = useCallback(async () => {
    const current = getStoredTokens();
    if (!current || !deviceId) {
      console.error('Cannot pause: not authenticated or no device');
      return;
    }
    await pausePlayback(current.accessToken, deviceId);
  }, [deviceId]);

  const logout = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    setTokens(null);
    setDeviceId(null);
    setIsPlayerReady(false);
    clearTokens();
  }, []);

  const getPlaybackPosition = useCallback(async (): Promise<number | null> => {
    if (!playerRef.current) return null;

    const state = await playerRef.current.getCurrentState();
    if (!state) return null;

    return state.position; // Returns position in milliseconds
  }, []);

  const syncPlayback = useCallback(async (targetPositionMs: number) => {
    const current = getStoredTokens();
    if (!current || !deviceId) return;

    const currentPosition = await getPlaybackPosition();
    if (currentPosition === null) return;

    // If we're more than 500ms out of sync, seek to correct position
    const drift = Math.abs(currentPosition - targetPositionMs);
    if (drift > 500) {
      console.log(`Syncing: drift of ${drift}ms detected`);
      await seekToPosition(current.accessToken, deviceId, targetPositionMs);
    }
  }, [deviceId, getPlaybackPosition]);

  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        isPlayerReady,
        isPremium,
        deviceId,
        accessToken: tokens?.accessToken ?? null,
        play,
        pause,
        logout,
        getPlaybackPosition,
        syncPlayback,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify(): SpotifyContextValue {
  return useContext(SpotifyContext);
}
