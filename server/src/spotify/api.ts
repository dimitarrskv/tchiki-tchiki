// Fetch preview audio and album art via Deezer's public API (no auth needed)
// Spotify deprecated preview_url, so we use Deezer for 30-second preview clips

import { TrackData } from './tracks';

export interface PreviewData {
  previewUrl: string | null;
  albumArt: string;
}

// In-memory cache keyed by "name - artist"
const previewCache = new Map<string, PreviewData>();

async function searchDeezerOnce(query: string): Promise<PreviewData> {
  const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    console.error(`Deezer search failed: ${res.status}`);
    return { previewUrl: null, albumArt: '' };
  }

  const data = await res.json();
  // Pick the first result that has a preview URL
  for (const hit of data.data || []) {
    if (hit.preview) {
      return {
        previewUrl: hit.preview,
        albumArt: hit.album?.cover_medium || hit.album?.cover || '',
      };
    }
  }
  return {
    previewUrl: null,
    albumArt: data.data?.[0]?.album?.cover_medium || '',
  };
}

async function searchDeezer(name: string, artist: string): Promise<PreviewData> {
  const cacheKey = `${name} - ${artist}`.toLowerCase();
  const cached = previewCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Try full query first
    let result = await searchDeezerOnce(`${name} ${artist}`);

    // Retry with just the track name if no preview found
    if (!result.previewUrl) {
      console.warn(`Deezer: no preview for "${name} ${artist}", retrying with track name only`);
      result = await searchDeezerOnce(name);
    }

    if (!result.previewUrl) {
      console.warn(`Deezer: no preview available for "${name}" after retries`);
    }

    previewCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error(`Deezer search error for "${name}":`, err.message);
    return { previewUrl: null, albumArt: '' };
  }
}

export async function fetchPreviewsForTracks(tracks: TrackData[]): Promise<Map<string, PreviewData>> {
  const results = new Map<string, PreviewData>();

  // Fetch all in parallel
  const promises = tracks.map(async (track) => {
    const data = await searchDeezer(track.name, track.artist);
    const trackId = track.uri.replace('spotify:track:', '');
    results.set(trackId, data);
  });

  await Promise.all(promises);
  return results;
}
