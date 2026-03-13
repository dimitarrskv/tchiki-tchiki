// Fetch preview audio and album art via Deezer's public API (no auth needed)
// Spotify deprecated preview_url, so we use Deezer for 30-second preview clips

import { TrackData } from './tracks';

export interface PreviewData {
  previewUrl: string | null;
  albumArt: string;
}

// In-memory cache keyed by "name - artist"
const previewCache = new Map<string, PreviewData>();

async function searchDeezer(name: string, artist: string): Promise<PreviewData> {
  const cacheKey = `${name} - ${artist}`.toLowerCase();
  const cached = previewCache.get(cacheKey);
  if (cached) return cached;

  try {
    const q = encodeURIComponent(`${name} ${artist}`);
    const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=1`);
    if (!res.ok) {
      console.error(`Deezer search failed: ${res.status}`);
      return { previewUrl: null, albumArt: '' };
    }

    const data = await res.json();
    const hit = data.data?.[0];
    if (!hit) {
      console.warn(`Deezer: no results for "${name} ${artist}"`);
      return { previewUrl: null, albumArt: '' };
    }

    const result: PreviewData = {
      previewUrl: hit.preview || null,
      albumArt: hit.album?.cover_medium || hit.album?.cover || '',
    };
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
