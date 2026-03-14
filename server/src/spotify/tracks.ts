// Curated track pool organized by genre
// Track URIs are kept for identification; audio comes from Deezer previews

export interface TrackData {
  uri: string;
  name: string;
  artist: string;
}

interface TrackPool {
  [genre: string]: TrackData[];
}

const TRACKS: TrackPool = {
  disco70s: [
    { uri: 'spotify:track:0DWdj2oZMBFSzRsi2Cvfzf', name: "Stayin' Alive", artist: 'Bee Gees' },
    { uri: 'spotify:track:3SVAN3BRByDmHOhKyIDxfC', name: 'Dancing Queen', artist: 'ABBA' },
    { uri: 'spotify:track:7dt6x5M1jzdTEt8oCbisTK', name: 'I Will Survive', artist: 'Gloria Gaynor' },
    { uri: 'spotify:track:2CEgGE6aESpnmtfiZwYlbV', name: 'Le Freak', artist: 'Chic' },
    { uri: 'spotify:track:4LI1ykYGFCcXPWkrYwPSoB', name: 'September', artist: 'Earth, Wind & Fire' },
    { uri: 'spotify:track:5aAx2yezTd8zXrkmtKl66Z', name: 'Funkytown', artist: 'Lipps Inc.' },
    { uri: 'spotify:track:3mRM4NM8iO7UBqrSigCQFH', name: 'Night Fever', artist: 'Bee Gees' },
    { uri: 'spotify:track:6npODGhhMMmIiK3WKoAcg1', name: 'Hot Stuff', artist: 'Donna Summer' },
    { uri: 'spotify:track:4BSIiPRMEBfDwfk0pYAl3a', name: 'YMCA', artist: 'Village People' },
    { uri: 'spotify:track:2TfSHkHiFO4gGlVPuMbLGW', name: 'I Feel Love', artist: 'Donna Summer' },
    { uri: 'spotify:track:5Xak5fmy089t0FYmh3VJiY', name: "That's the Way (I Like It)", artist: 'KC and the Sunshine Band' },
    { uri: 'spotify:track:1kRFsLbRXDYiGGsnHBaFsr', name: 'Boogie Wonderland', artist: 'Earth, Wind & Fire' },
  ],
  funk_soul: [
    { uri: 'spotify:track:7GhIk7Il098yCjg4BQjzvb', name: 'I Got You (I Feel Good)', artist: 'James Brown' },
    { uri: 'spotify:track:1h2xVEoJORqrg71HocgqXd', name: 'Superstition', artist: 'Stevie Wonder' },
    { uri: 'spotify:track:0cGG0EBEz4MUjNljMg6PeJ', name: 'Got to Give It Up', artist: 'Marvin Gaye' },
    { uri: 'spotify:track:4LfBGGJDnHPMRiOHnJlOau', name: 'Celebration', artist: 'Kool & The Gang' },
    { uri: 'spotify:track:5Z01UMMf7V1o0MzF86s6WJ', name: 'I Want You Back', artist: 'The Jackson 5' },
    { uri: 'spotify:track:7s25THrKz86DM225dOYwnr', name: 'Respect', artist: 'Aretha Franklin' },
    { uri: 'spotify:track:39shmbIHICJ2jUBJCBdkBe', name: "Ain't No Stoppin' Us Now", artist: 'McFadden & Whitehead' },
    { uri: 'spotify:track:6SpLc7EXZIPpy0sVko0aoU', name: 'Play That Funky Music', artist: 'Wild Cherry' },
    { uri: 'spotify:track:7hQJA50XrCWABAu5v6QZ4i', name: "Let's Stay Together", artist: 'Al Green' },
    { uri: 'spotify:track:14lEoJp9VPrGSHOEemB2Jg', name: 'Brick House', artist: 'Commodores' },
  ],
  eighties: [
    { uri: 'spotify:track:5ChkMS8OtdzJeqyybCc9R5', name: 'Billie Jean', artist: 'Michael Jackson' },
    { uri: 'spotify:track:2EF2SJQBQHk6HTxdQ3NVVY', name: 'Thriller', artist: 'Michael Jackson' },
    { uri: 'spotify:track:2WfaOiMkCvy7F5fcp2zZ8L', name: 'Take On Me', artist: 'a-ha' },
    { uri: 'spotify:track:4y1LsJpmMti1PfRQV9AWWe', name: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper' },
    { uri: 'spotify:track:2tUBqZG2AbRi7Q0BIrVrEj', name: 'I Wanna Dance with Somebody', artist: 'Whitney Houston' },
    { uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', name: 'Never Gonna Give You Up', artist: 'Rick Astley' },
    { uri: 'spotify:track:2XI5s0AMWFB5m8Dmt0Nz1Z', name: 'Wake Me Up Before You Go-Go', artist: 'Wham!' },
    { uri: 'spotify:track:1TfqLAPs4K3s2rJMoCokcS', name: 'Material Girl', artist: 'Madonna' },
    { uri: 'spotify:track:62LJFaYAIBnnnIVlQov9FI', name: "Don't Stop Me Now", artist: 'Queen' },
    { uri: 'spotify:track:54flyrjcdnQdco2300avMJ', name: 'Footloose', artist: 'Kenny Loggins' },
    { uri: 'spotify:track:2zYzyRzz6pRmhPzyfMEC8s', name: 'Maniac', artist: 'Michael Sembello' },
    { uri: 'spotify:track:1tWoHQqdJFpMdLEaiKp0Da', name: "Let's Dance", artist: 'David Bowie' },
  ],
  nineties: [
    { uri: 'spotify:track:3yfqSUWxFvZELEM4PmlwIR', name: 'Hey Ya!', artist: 'Outkast' },
    { uri: 'spotify:track:1Je1IMUlBXcx1Fz0WE7oeT', name: 'Wannabe', artist: 'Spice Girls' },
    { uri: 'spotify:track:2gMXnyrvIjhGBU4GXMHP3a', name: 'Barbie Girl', artist: 'Aqua' },
    { uri: 'spotify:track:23fqKkggKUBHNkbKtXEls4', name: 'Everybody (Backstreets Back)', artist: 'Backstreet Boys' },
    { uri: 'spotify:track:1rfVoXMJjYz9IYQz0TaHbi', name: 'Macarena', artist: 'Los Del Rio' },
    { uri: 'spotify:track:0u2P5u6lvoDfGbGUH2GiGo', name: 'What Is Love', artist: 'Haddaway' },
    { uri: 'spotify:track:1B75hgRqe7A4fwee3g3Wmu', name: "U Can't Touch This", artist: 'MC Hammer' },
    { uri: 'spotify:track:2bR8JXCQkqCFqe4B3KTf0C', name: 'Gonna Make You Sweat', artist: 'C+C Music Factory' },
    { uri: 'spotify:track:3Sp2h8JuFdGMGf6j6LRxn1', name: 'MMMBop', artist: 'Hanson' },
    { uri: 'spotify:track:37ZJ0p5Jm13GEiablM4rcy', name: 'Jump Around', artist: 'House of Pain' },
  ],
  retro_party: [
    { uri: 'spotify:track:32OlwWuMpZ6b0aN2RZOeMS', name: 'Uptown Funk', artist: 'Bruno Mars' },
    { uri: 'spotify:track:2zYzyRzz6pRmhPzyfMEC8a', name: 'Get Lucky', artist: 'Daft Punk' },
    { uri: 'spotify:track:60nZcImufyMA1MKQY3dcCH', name: 'Happy', artist: 'Pharrell Williams' },
    { uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', name: 'Blinding Lights', artist: 'The Weeknd' },
    { uri: 'spotify:track:39LLxExYz6ewLAcYrzQQyP', name: 'Levitating', artist: 'Dua Lipa' },
    { uri: 'spotify:track:5ghIJDpPoe3CfHMGu71E6T', name: "Don't Stop Believin'", artist: 'Journey' },
    { uri: 'spotify:track:2HL4lMNpiOgRWpaOlgBiAj', name: "Hips Don't Lie", artist: 'Shakira' },
    { uri: 'spotify:track:6habFhsOp2NvshLv26DqMb', name: 'Despacito', artist: 'Luis Fonsi' },
    { uri: 'spotify:track:1AWQoqb9bSvzTjaLralEkT', name: 'Dynamite', artist: 'BTS' },
    { uri: 'spotify:track:0hulkMyaHdJzGadXFLZn5L', name: 'Shut Up and Dance', artist: 'Walk the Moon' },
  ],
  dance_anthems: [
    { uri: 'spotify:track:da01', name: 'Cha Cha Slide', artist: 'DJ Casper' },
    { uri: 'spotify:track:da02', name: 'Cupid Shuffle', artist: 'Cupid' },
    { uri: 'spotify:track:da03', name: 'Electric Boogie', artist: 'Marcia Griffiths' },
    { uri: 'spotify:track:da04', name: 'Cotton Eye Joe', artist: 'Rednex' },
    { uri: 'spotify:track:da05', name: 'Mambo No. 5', artist: 'Lou Bega' },
    { uri: 'spotify:track:da06', name: 'Rasputin', artist: 'Boney M' },
    { uri: 'spotify:track:da07', name: 'Kung Fu Fighting', artist: 'Carl Douglas' },
    { uri: 'spotify:track:da08', name: 'The Twist', artist: 'Chubby Checker' },
    { uri: 'spotify:track:da09', name: 'Twist and Shout', artist: 'The Beatles' },
    { uri: 'spotify:track:da10', name: 'La Bamba', artist: 'Ritchie Valens' },
    { uri: 'spotify:track:da11', name: 'Daddy Cool', artist: 'Boney M' },
    { uri: 'spotify:track:da12', name: 'Gimme! Gimme! Gimme!', artist: 'ABBA' },
  ],
  y2k_dance: [
    { uri: 'spotify:track:y2k01', name: 'Yeah!', artist: 'Usher' },
    { uri: 'spotify:track:y2k02', name: 'Crazy in Love', artist: 'Beyonce' },
    { uri: 'spotify:track:y2k03', name: 'Single Ladies', artist: 'Beyonce' },
    { uri: 'spotify:track:y2k04', name: 'Toxic', artist: 'Britney Spears' },
    { uri: 'spotify:track:y2k05', name: 'Rock Your Body', artist: 'Justin Timberlake' },
    { uri: 'spotify:track:y2k06', name: 'In Da Club', artist: '50 Cent' },
    { uri: 'spotify:track:y2k07', name: 'Party Rock Anthem', artist: 'LMFAO' },
    { uri: 'spotify:track:y2k08', name: 'I Gotta Feeling', artist: 'Black Eyed Peas' },
    { uri: 'spotify:track:y2k09', name: 'Moves Like Jagger', artist: 'Maroon 5' },
    { uri: 'spotify:track:y2k10', name: 'Poker Face', artist: 'Lady Gaga' },
    { uri: 'spotify:track:y2k11', name: 'SexyBack', artist: 'Justin Timberlake' },
    { uri: 'spotify:track:y2k12', name: 'Pump It', artist: 'Black Eyed Peas' },
  ],
  latin_dance: [
    { uri: 'spotify:track:ld01', name: 'Waka Waka', artist: 'Shakira' },
    { uri: 'spotify:track:ld02', name: 'Bailando', artist: 'Enrique Iglesias' },
    { uri: 'spotify:track:ld03', name: 'Gasolina', artist: 'Daddy Yankee' },
    { uri: 'spotify:track:ld04', name: 'Suavemente', artist: 'Elvis Crespo' },
    { uri: 'spotify:track:ld05', name: "Livin' La Vida Loca", artist: 'Ricky Martin' },
    { uri: 'spotify:track:ld06', name: 'Danza Kuduro', artist: 'Don Omar' },
    { uri: 'spotify:track:ld07', name: 'Bamboleo', artist: 'Gipsy Kings' },
    { uri: 'spotify:track:ld08', name: 'Conga', artist: 'Gloria Estefan' },
    { uri: 'spotify:track:ld09', name: 'La Tortura', artist: 'Shakira' },
    { uri: 'spotify:track:ld10', name: 'Vivir Mi Vida', artist: 'Marc Anthony' },
  ],
  modern_dance: [
    { uri: 'spotify:track:md01', name: 'Shake It Off', artist: 'Taylor Swift' },
    { uri: 'spotify:track:md02', name: "Can't Stop the Feeling", artist: 'Justin Timberlake' },
    { uri: 'spotify:track:md03', name: 'Dance Monkey', artist: 'Tones and I' },
    { uri: 'spotify:track:md04', name: 'Gangnam Style', artist: 'PSY' },
    { uri: 'spotify:track:md05', name: 'Sorry', artist: 'Justin Bieber' },
    { uri: 'spotify:track:md06', name: 'Timber', artist: 'Pitbull' },
    { uri: 'spotify:track:md07', name: 'Cheap Thrills', artist: 'Sia' },
    { uri: 'spotify:track:md08', name: 'One Kiss', artist: 'Calvin Harris & Dua Lipa' },
    { uri: 'spotify:track:md09', name: 'Physical', artist: 'Dua Lipa' },
    { uri: 'spotify:track:md10', name: 'Rather Be', artist: 'Clean Bandit' },
    { uri: 'spotify:track:md11', name: 'Attention', artist: 'Charlie Puth' },
    { uri: 'spotify:track:md12', name: 'About Damn Time', artist: 'Lizzo' },
  ],
};

// Get all tracks as a flat array
function getAllTracks(): TrackData[] {
  return Object.values(TRACKS).flat();
}

// Get N unique random tracks with full metadata
export function getUniqueRandomTrackData(count: number): TrackData[] {
  const all = getAllTracks();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get available genres
export function getAvailableGenres(): string[] {
  return Object.keys(TRACKS);
}
