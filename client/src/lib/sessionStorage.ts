/**
 * Session persistence for reconnection support
 * Stores player session info in localStorage to enable auto-rejoin after disconnect
 */

const SESSION_KEY = 'spotifight_session';
const SESSION_TIMEOUT_MS = 3600000; // 1 hour

export interface SessionData {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  joinedAt: number;
}

export function saveSession(data: Omit<SessionData, 'joinedAt'>): void {
  try {
    const session: SessionData = {
      ...data,
      joinedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
}

export function getSession(): SessionData | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: SessionData = JSON.parse(stored);

    // Check if session is expired
    if (Date.now() - session.joinedAt > SESSION_TIMEOUT_MS) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.warn('Failed to retrieve session:', error);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}

export function updateSessionTimestamp(): void {
  const session = getSession();
  if (session) {
    saveSession(session);
  }
}
