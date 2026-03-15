// Hybrid audio playback for maximum mobile compatibility.
// 1. Try Web Audio API (bypasses iOS silent switch)
// 2. Fall back to HTML Audio element (works if CORS blocks fetch)
//
// On iOS Safari, always await ctx.resume() before scheduling Web Audio
// nodes. Scheduling on a suspended context is unreliable — currentTime
// may jump past the scheduled times once resume completes, causing
// sounds to be silently skipped.

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let fallbackAudio: HTMLAudioElement | null = null;
let usingFallback = false;

export function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(audioContext.destination);
  }
  return audioContext;
}

function getFallbackAudio(): HTMLAudioElement {
  if (!fallbackAudio) {
    fallbackAudio = new Audio();
    fallbackAudio.volume = 0.8;
  }
  return fallbackAudio;
}

/** Call from a click/tap handler to unlock audio on iOS. */
export function unlockAudio(): void {
  const ctx = getContext();
  ctx.resume().catch(() => {});

  const audio = getFallbackAudio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  audio.play().catch(() => {});
}

/** Play a preview URL. Uses HTML Audio (reliable on mobile once unlocked). */
export async function playPreview(url: string): Promise<void> {
  stopPreview();
  usingFallback = true;

  const audio = getFallbackAudio();
  audio.src = url;
  await audio.play();
}

/** Stop playback. */
export function stopPreview(): void {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    currentSource.disconnect();
    currentSource = null;
  }
  if (fallbackAudio) {
    fallbackAudio.pause();
    fallbackAudio.currentTime = 0;
  }
}

/** Seek to a specific time. */
export function seekPreview(timeSeconds: number): void {
  if (usingFallback && fallbackAudio) {
    fallbackAudio.currentTime = timeSeconds;
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
  const audio = getFallbackAudio();
  audio.src = getTestToneUrl();
  audio.play().catch(() => {});
}

/** Play a "time's up" impact hit — bass drop + noise crack + sparkle. */
export function playTimesUp(): void {
  const ctx = getContext();
  ctx.resume().then(() => {
    const now = ctx.currentTime;

    // 1. Sub bass hit — sine wave with sharp pitch drop
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.4);

    // 2. Noise burst for the "crack" — white noise through a bandpass
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseBand = ctx.createBiquadFilter();
    noiseBand.type = 'bandpass';
    noiseBand.frequency.value = 4000;
    noiseBand.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(noiseBand);
    noiseBand.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 3. High sparkle — quick sine ping for sci-fi feel
    const ping = ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(2400, now);
    ping.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    const pingGain = ctx.createGain();
    pingGain.gain.setValueAtTime(0.12, now);
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.start(now);
    ping.stop(now + 0.2);
  }).catch(() => {});
}
