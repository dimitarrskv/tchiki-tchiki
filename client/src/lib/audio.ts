// Singleton Audio element for mobile playback.
// iOS Safari blocks new Audio().play() unless the *same* element
// was previously played during a user gesture.

let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.volume = 0.8;
  }
  return sharedAudio;
}

/** Call this from a click/tap handler to unlock audio on iOS. */
export function unlockAudio(): void {
  const audio = getAudio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  audio.play().catch(() => {});
}

/** Play a preview URL through the pre-unlocked element. */
export async function playPreview(url: string): Promise<void> {
  const audio = getAudio();
  audio.src = url;
  await audio.play();
}

/** Stop and reset the shared audio element. */
export function stopPreview(): void {
  const audio = getAudio();
  audio.pause();
  audio.src = '';
}

/** Seek to a specific time (for sync correction). */
export function seekPreview(timeSeconds: number): void {
  const audio = getAudio();
  if (audio.src) {
    audio.currentTime = timeSeconds;
  }
}
