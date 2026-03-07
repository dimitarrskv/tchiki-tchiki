// ─── Spotify PKCE Auth Helpers ─────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify-callback`;
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

const TOKEN_KEY = 'spotify_tokens';
const VERIFIER_KEY = 'spotify_code_verifier';
const STATE_KEY = 'spotify_auth_state';

// ─── Token Storage ───────────────────────────────────────

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
}

export function getStoredTokens(): SpotifyTokens | null {
  const data = sessionStorage.getItem(TOKEN_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function storeTokens(tokens: SpotifyTokens): void {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(tokens: SpotifyTokens): boolean {
  return Date.now() >= tokens.expiresAt - 60_000; // 60s buffer
}

// ─── PKCE Helpers ────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

// ─── Auth Flow ───────────────────────────────────────────

export async function startSpotifyAuth(roomCode?: string): Promise<void> {
  if (!CLIENT_ID) {
    console.error('VITE_SPOTIFY_CLIENT_ID is not set');
    return;
  }

  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier for the callback
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier);

  // Store room code in state so we can redirect back after auth
  const state = JSON.stringify({ roomCode: roomCode || '' });
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleSpotifyCallback(code: string): Promise<SpotifyTokens> {
  const codeVerifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('No code verifier found. Please restart auth flow.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
  }

  const data = await response.json();

  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  storeTokens(tokens);
  sessionStorage.removeItem(VERIFIER_KEY);

  return tokens;
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokens> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  storeTokens(tokens);
  return tokens;
}

// ─── Spotify Web API Helpers ─────────────────────────────

export async function spotifyFetch(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function startPlayback(
  accessToken: string,
  deviceId: string,
  trackUri: string
): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function pausePlayback(
  accessToken: string,
  deviceId: string
): Promise<void> {
  await spotifyFetch(`/me/player/pause?device_id=${deviceId}`, accessToken, {
    method: 'PUT',
  });
}

export async function seekToPosition(
  accessToken: string,
  deviceId: string,
  positionMs: number
): Promise<void> {
  await spotifyFetch(`/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`, accessToken, {
    method: 'PUT',
  });
}

export async function getUserProfile(accessToken: string) {
  const res = await spotifyFetch('/me', accessToken);
  return res.json();
}

// ─── Get auth state from callback ────────────────────────

export function getAuthState(): { roomCode: string } | null {
  const state = sessionStorage.getItem(STATE_KEY);
  if (!state) return null;
  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

export function clearAuthState(): void {
  sessionStorage.removeItem(STATE_KEY);
}
