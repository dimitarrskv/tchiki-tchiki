// Curated track pool organized by genre
// These are Spotify track URIs for well-known, recognizable songs

interface TrackPool {
  [genre: string]: string[];
}

const TRACKS: TrackPool = {
  pop: [
    'spotify:track:7qiZfU4dY1lWllzX7mPBI3', // Shape of You - Ed Sheeran
    'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights - The Weeknd
    'spotify:track:3KkXRkHbMCARz0aVfEt68P', // Sunflower - Post Malone
    'spotify:track:2Fxmhks0bxGSBdJ92vM42m', // bad guy - Billie Eilish
    'spotify:track:60nZcImufyMA1MKQY3dcCH', // Happy - Pharrell Williams
    'spotify:track:1zi7xx7UVEFkmKfv06H8x0', // One Dance - Drake
    'spotify:track:6habFhsOp2NvshLv26DqMb', // Levitating - Dua Lipa
    'spotify:track:5RBapThGeRk5z3dO5S2jXL', // Flowers - Miley Cyrus
  ],
  rock: [
    'spotify:track:5ghIJDpPoe3CfHMGu71E6T', // Bohemian Rhapsody - Queen
    'spotify:track:7lPN2DXiMsVn7XUKtOW1CS', // Smells Like Teen Spirit - Nirvana
    'spotify:track:5CQ30WqJwcep0pYcV4AMNc', // Stairway to Heaven - Led Zeppelin
    'spotify:track:4u7EnebtmKWzUH433cf5Qv', // Bohemian Rhapsody - Queen
    'spotify:track:40riOy7x9W7GXjyGp4pjAv', // Hotel California - Eagles
    'spotify:track:6dGnYIeXmHdcikdzNNDMm2', // In the End - Linkin Park
    'spotify:track:0hulkMyaHdJzGadXFLZn5L', // Don't Stop Believin' - Journey
    'spotify:track:4gphxUgq0JSFv2BCLhNDiO', // Sweet Child O' Mine - Guns N' Roses
  ],
  hiphop: [
    'spotify:track:7GhIk7Il098yCjg4BQjzvb', // Old Town Road - Lil Nas X
    'spotify:track:2xLMifQCjDGFmkHkpNLD9h', // SICKO MODE - Travis Scott
    'spotify:track:2SAqBLGA283SUDbqRDBCwF', // Lose Yourself - Eminem
    'spotify:track:3yfqSUWxFvZELEM4PmlwIR', // Hey Ya! - Outkast
    'spotify:track:7KXjTSCq5nL1LoYtL7XAwS', // HUMBLE. - Kendrick Lamar
    'spotify:track:0wwPcA6wtMf6HUMpIRdeP7', // Hotline Bling - Drake
    'spotify:track:4Li2WHPkuyCdtmokzW2007', // Juicy - Notorious B.I.G.
    'spotify:track:5rb9QrpfcKFHM1EUbSIurX', // Gin and Juice - Snoop Dogg
  ],
  electronic: [
    'spotify:track:32OlwWuMpZ6b0aN2RZOeMS', // Uptown Funk - Bruno Mars
    'spotify:track:2zYzyRzz6pRmhPzyfMEC8s', // Get Lucky - Daft Punk
    'spotify:track:60a0Rd6pjrkxjPbaKzXjfq', // In the Name of Love - Martin Garrix
    'spotify:track:2VxeLyX666F8uXCJ0dZF8B', // Lean On - Major Lazer
    'spotify:track:1V4jC0vJ5525lEF1bFgPX2', // Titanium - David Guetta
    'spotify:track:60wwxj6Dd9NJlirf27IuaR', // Wake Me Up - Avicii
    'spotify:track:1jJci4qxiYcOHhQR247rEU', // Levels - Avicii
    'spotify:track:1PSBzsahR2AKwLJgx8kS4e', // Faded - Alan Walker
  ],
  latin: [
    'spotify:track:6habFhsOp2NvshLv26DqMb', // Despacito - Luis Fonsi
    'spotify:track:6mFkJmJqdDVQ1REhVfGgd1', // Waka Waka - Shakira
    'spotify:track:6RUKPb4LETWmmr3iAEQktW', // Mi Gente - J Balvin
    'spotify:track:3n69hLUdIsSa1WlRmjMZlW', // Danza Kuduro - Don Omar
    'spotify:track:2HL4lMNpiOgRWpaOlgBiAj', // Hips Don't Lie - Shakira
    'spotify:track:4McFm0yxlQSMlHSoEYOuxl', // Taki Taki - DJ Snake
  ],
  disco: [
    'spotify:track:0DWdj2oZMBFSzRsi2Cvfzf', // Stayin' Alive - Bee Gees
    'spotify:track:3SVAN3BRByDmHOhKyIDxfC', // Dancing Queen - ABBA
    'spotify:track:7dt6x5M1jzdTEt8oCbisTK', // I Will Survive - Gloria Gaynor
    'spotify:track:2CEgGE6aESpnmtfiZwYlbV', // Le Freak - Chic
    'spotify:track:4LI1ykYGFCcXPWkrYwPSoB', // September - Earth, Wind & Fire
    'spotify:track:5aAx2yezTd8zXrkmtKl66Z', // Funkytown - Lipps Inc.
  ],
};

// Get all track URIs as a flat array
function getAllTracks(): string[] {
  return Object.values(TRACKS).flat();
}

// Get a random track from any genre
export function getRandomTrack(): string {
  const all = getAllTracks();
  return all[Math.floor(Math.random() * all.length)];
}

// Get a random track from a specific genre
export function getRandomTrackByGenre(genre: string): string {
  const tracks = TRACKS[genre];
  if (!tracks || tracks.length === 0) {
    return getRandomTrack();
  }
  return tracks[Math.floor(Math.random() * tracks.length)];
}

// Get N unique random tracks (for Music Pairs where each pair needs a different song)
export function getUniqueRandomTracks(count: number): string[] {
  const all = getAllTracks();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get available genres
export function getAvailableGenres(): string[] {
  return Object.keys(TRACKS);
}
