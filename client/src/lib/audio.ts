// HTML Audio playback for maximum mobile compatibility.
// A single shared Audio element is used for all playback (music + SFX).
// Mobile browsers (especially iOS Safari) only allow one active audio
// element at a time, so using separate elements breaks music playback.
//
// To prevent SFX (countdown ticks, times-up) from overwriting the music
// src mid-playback, SFX calls are skipped while music is playing.

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let sharedAudio: HTMLAudioElement | null = null;
let usingFallback = false;
let musicPlaying = false;

export function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(audioContext.destination);
  }
  return audioContext;
}

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.volume = 0.8;
  }
  return sharedAudio;
}

/** Call from a click/tap handler to unlock audio on iOS. */
export function unlockAudio(): void {
  const ctx = getContext();
  ctx.resume().catch(() => {});

  // Don't overwrite the shared audio element while music is playing
  if (musicPlaying) return;

  const audio = getAudio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  audio.play().catch(() => {});
}

/** Play a preview URL. Uses HTML Audio (reliable on mobile once unlocked). */
export async function playPreview(url: string): Promise<void> {
  stopPreview();
  usingFallback = true;
  musicPlaying = true;

  // Resume AudioContext in case iOS suspended it between rounds
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume().catch(() => {});
  }

  const audio = getAudio();
  audio.src = url;
  audio.load();

  await new Promise<void>((resolve, reject) => {
    const onPlay = () => { cleanup(); resolve(); };
    const onError = () => {
      cleanup();
      const e = audio.error;
      reject(new Error(`Audio load failed: ${e?.message || `code ${e?.code}`}`));
    };
    const cleanup = () => {
      audio.removeEventListener('playing', onPlay);
      audio.removeEventListener('error', onError);
      clearTimeout(timeout);
    };
    // Timeout: if 'playing' event doesn't fire within 8s, reject
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Audio playback timed out'));
    }, 8000);
    audio.addEventListener('playing', onPlay, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.play().catch(err => { cleanup(); reject(err); });
  });
}

/** Stop playback. */
export function stopPreview(): void {
  musicPlaying = false;
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    currentSource.disconnect();
    currentSource = null;
  }
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
}

/** Seek to a specific time. */
export function seekPreview(timeSeconds: number): void {
  if (usingFallback && sharedAudio) {
    sharedAudio.currentTime = timeSeconds;
  }
}

// Pre-generated test tone WAV (two ascending pings) — avoids Web Audio
// entirely so it works on the first tap on mobile.
let testToneUrl: string | null = null;

function getTestToneUrl(): string {
  if (testToneUrl) return testToneUrl;

  const rate = 22050;
  const len = (rate * 0.3) | 0;
  const buf = new ArrayBuffer(44 + len * 2);
  const v = new DataView(buf);

  // WAV header
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len * 2, true);

  // Two pings: 600 Hz then 900 Hz with exponential decay
  for (let i = 0; i < len; i++) {
    const t = i / rate;
    let s = 0;
    if (t < 0.12) {
      s = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 25) * 0.3;
    } else if (t >= 0.15 && t < 0.27) {
      const t2 = t - 0.15;
      s = Math.sin(2 * Math.PI * 900 * t2) * Math.exp(-t2 * 25) * 0.3;
    }
    v.setInt16(44 + i * 2, (s * 32767) | 0, true);
  }

  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  testToneUrl = 'data:audio/wav;base64,' + btoa(bin);
  return testToneUrl;
}

/** Play a short test tone via HTML Audio — reliable on mobile first tap. */
export function playTestTone(): void {
  if (musicPlaying) return;
  const audio = getAudio();
  audio.src = getTestToneUrl();
  audio.play().catch(() => {});
}

// Cache for generated sound WAVs
const wavCache = new Map<string, string>();

/** Generate a WAV data URI from raw sample data. */
function makeWav(rate: number, samples: Float32Array): string {
  const len = samples.length;
  const buf = new ArrayBuffer(44 + len * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) {
    v.setInt16(44 + i * 2, (Math.max(-1, Math.min(1, samples[i])) * 32767) | 0, true);
  }
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

/** Play a countdown tick (3, 2, or 1) via HTML Audio.
 *  Uses the same sub-bass + noise + ping layers as playTimesUp()
 *  with escalating intensity so they build toward the final hit. */
export function playCountdownTick(count: number): void {
  if (musicPlaying) return;
  const key = `tick-${count}`;
  if (!wavCache.has(key)) {
    // Escalating presets: 3 = lightest, 1 = heaviest (closest to times-up)
    const presets: Record<number, {
      dur: number;
      subFrom: number; subTo: number; subDrop: number; subAmp: number; subDecay: number;
      noiseDur: number; noiseAmp: number; noiseDecay: number;
      pingFrom: number; pingTo: number; pingDrop: number; pingAmp: number; pingDecay: number; pingEnd: number;
    }> = {
      3: { dur: 0.2,  subFrom: 200, subTo: 100, subDrop: 0.12, subAmp: 0.15, subDecay: 12, noiseDur: 0.02, noiseAmp: 0.08, noiseDecay: 40, pingFrom: 1200, pingTo: 600,  pingDrop: 0.1,  pingAmp: 0.08, pingDecay: 18, pingEnd: 0.12 },
      2: { dur: 0.25, subFrom: 180, subTo: 70,  subDrop: 0.15, subAmp: 0.25, subDecay: 8,  noiseDur: 0.04, noiseAmp: 0.15, noiseDecay: 35, pingFrom: 1600, pingTo: 700,  pingDrop: 0.12, pingAmp: 0.1,  pingDecay: 15, pingEnd: 0.16 },
      1: { dur: 0.3,  subFrom: 160, subTo: 50,  subDrop: 0.18, subAmp: 0.32, subDecay: 6,  noiseDur: 0.06, noiseAmp: 0.2,  noiseDecay: 30, pingFrom: 2000, pingTo: 750,  pingDrop: 0.15, pingAmp: 0.12, pingDecay: 12, pingEnd: 0.2  },
    };
    const p = presets[count] ?? presets[1];
    const rate = 22050;
    const len = (rate * p.dur) | 0;
    const samples = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      // Sub bass hit — sine with pitch drop (same shape as times-up)
      const subFreq = p.subFrom * Math.pow(p.subTo / p.subFrom, Math.min(1, t / p.subDrop));
      const sub = Math.sin(2 * Math.PI * subFreq * t) * Math.exp(-t * p.subDecay) * p.subAmp;
      // Noise crack
      const noise = t < p.noiseDur ? (Math.random() * 2 - 1) * Math.exp(-t * p.noiseDecay) * p.noiseAmp : 0;
      // Sparkle ping — sine with pitch drop
      const pingFreq = p.pingFrom * Math.pow(p.pingTo / p.pingFrom, Math.min(1, t / p.pingDrop));
      const ping = t < p.pingEnd ? Math.sin(2 * Math.PI * pingFreq * t) * Math.exp(-t * p.pingDecay) * p.pingAmp : 0;
      samples[i] = sub + noise + ping;
    }
    wavCache.set(key, makeWav(rate, samples));
  }
  const audio = getAudio();
  audio.src = wavCache.get(key)!;
  audio.play().catch(() => {});
}

/** Play a "time's up" impact hit via HTML Audio. */
export function playTimesUp(): void {
  if (!wavCache.has('timesup')) {
    const rate = 22050;
    const len = (rate * 0.4) | 0;
    const samples = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      // Sub bass hit — sine with pitch drop
      const subFreq = 150 * Math.pow(35 / 150, Math.min(1, t / 0.2));
      const sub = Math.sin(2 * Math.PI * subFreq * t) * Math.exp(-t * 5) * 0.4;
      // Noise crack
      const noise = t < 0.08 ? (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.25 : 0;
      // Sparkle ping
      const pingFreq = 2400 * Math.pow(800 / 2400, Math.min(1, t / 0.15));
      const ping = t < 0.2 ? Math.sin(2 * Math.PI * pingFreq * t) * Math.exp(-t * 12) * 0.12 : 0;
      samples[i] = sub + noise + ping;
    }
    wavCache.set('timesup', makeWav(rate, samples));
  }
  // timesUp plays after stopPreview() clears musicPlaying, so no guard needed
  const audio = getAudio();
  audio.src = wavCache.get('timesup')!;
  audio.play().catch(() => {});
}
