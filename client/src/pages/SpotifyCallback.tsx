import { useEffect, useState } from 'react';
import { handleSpotifyCallback, getAuthState, clearAuthState } from '../lib/spotify';
import { MobileShell } from '../components/layout/MobileShell';

export function SpotifyCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    console.log('[SpotifyCallback] Params:', { code: code?.slice(0, 10) + '...', errorParam });

    if (errorParam) {
      setError(`Spotify authorization denied: ${errorParam}`);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    console.log('[SpotifyCallback] Exchanging code for tokens...');
    handleSpotifyCallback(code)
      .then((tokens) => {
        console.log('[SpotifyCallback] Tokens received, redirecting...', {
          hasAccessToken: !!tokens.accessToken,
          expiresAt: new Date(tokens.expiresAt).toISOString(),
        });
        // Redirect back to the app (optionally with room code)
        const state = getAuthState();
        clearAuthState();

        if (state?.roomCode) {
          console.log('[SpotifyCallback] Redirecting to home with room code:', state.roomCode);
          window.location.href = `/?code=${state.roomCode}`;
        } else {
          console.log('[SpotifyCallback] Redirecting to home');
          window.location.href = '/';
        }
      })
      .catch((err) => {
        console.error('[SpotifyCallback] Error:', err);
        setError(err.message || 'Failed to complete Spotify authentication');
      });
  }, []);

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {error ? (
          <>
            <div className="text-4xl mb-4">😕</div>
            <div className="text-xl font-bold text-primary mb-2">Auth Failed</div>
            <div className="text-text-muted mb-6">{error}</div>
            <button
              onClick={() => (window.location.href = '/')}
              className="bg-bg-card border border-border hover:bg-bg-hover px-6 py-3 rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <div className="text-xl font-bold mb-2">Connecting Spotify...</div>
            <div className="text-text-muted">Please wait</div>
          </>
        )}
      </div>
    </MobileShell>
  );
}
