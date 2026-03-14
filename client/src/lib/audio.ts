// Hybrid audio playback for maximum mobile compatibility.
// 1. Try Web Audio API (bypasses iOS silent switch)
// 2. Fall back to HTML Audio element (works if CORS blocks fetch)
//
// Key insight: Web Audio nodes can be scheduled on a suspended context.
// They queue up and play the instant ctx.resume() completes. So we never
// need to await resume or guard on ctx.state — just call resume()
// fire-and-forget during a user gesture and schedule sounds immediately.

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

/** Play a preview URL. Tries Web Audio API first, falls back to Audio element. */
export async function playPreview(url: string): Promise<void> {
  stopPreview();
  usingFallback = false;

  const ctx = getContext();
  console.log('[audio] playPreview — ctx.state:', ctx.state);

  try {
    await ctx.resume();
    console.log('[audio] ctx resumed, state:', ctx.state);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    console.log('[audio] fetched', arrayBuffer.byteLength, 'bytes');
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    currentSource = ctx.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(gainNode!);
    currentSource.start();
    console.log('[audio] Web Audio playing');
  } catch (err) {
    console.warn('[audio] Web Audio failed, falling back to Audio element:', err);
    usingFallback = true;

    try {
      const audio = getFallbackAudio();
      audio.src = url;
      await audio.play();
      console.log('[audio] HTML Audio fallback playing');
    } catch (fallbackErr) {
      console.error('[audio] Both playback methods failed:', fallbackErr);
      throw fallbackErr;
    }
  }
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

/** Play a short test tone — two ascending pings to confirm audio works. */
export function playTestTone(): void {
  const ctx = getContext();
  ctx.resume().catch(() => {});
  const now = ctx.currentTime;

  [0, 0.15].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = i === 0 ? 600 : 900;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + offset);
    g.gain.linearRampToValueAtTime(0.25, now + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

/** Play a "time's up" impact hit — bass drop + noise crack + sparkle. */
export function playTimesUp(): void {
  const ctx = getContext();
  ctx.resume().catch(() => {});
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
}
