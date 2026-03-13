// Audio playback via Web Audio API.
// On iOS, HTML5 Audio respects the silent mode switch (no sound),
// but AudioContext ignores it — so we route everything through Web Audio API.

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentBuffer: AudioBuffer | null = null;
let gainNode: GainNode | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(audioContext.destination);
  }
  return audioContext;
}

/** Call this from a click/tap handler to unlock AudioContext on iOS. */
export function unlockAudio(): void {
  const ctx = getContext();
  ctx.resume().catch(() => {});
}

/** Fetch audio from URL and play through Web Audio API. */
export async function playPreview(url: string): Promise<void> {
  const ctx = getContext();
  await ctx.resume();

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  currentBuffer = await ctx.decodeAudioData(arrayBuffer);

  stopSource();

  currentSource = ctx.createBufferSource();
  currentSource.buffer = currentBuffer;
  currentSource.connect(gainNode!);
  currentSource.start();
}

/** Stop playback. */
export function stopPreview(): void {
  stopSource();
  currentBuffer = null;
}

/** Seek to a specific time (recreates the source at offset). */
export function seekPreview(timeSeconds: number): void {
  if (!currentBuffer || !audioContext || !gainNode) return;

  stopSource();

  currentSource = audioContext.createBufferSource();
  currentSource.buffer = currentBuffer;
  currentSource.connect(gainNode);
  currentSource.start(0, timeSeconds);
}

function stopSource(): void {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    currentSource.disconnect();
    currentSource = null;
  }
}
