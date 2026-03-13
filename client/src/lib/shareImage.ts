// Platform-aware image sharing (Web Share API on mobile, download on desktop)

export async function shareImage(
  blob: Blob,
  filename: string = 'tchiki-tchiki-results.png',
): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });

  // Mobile: native share sheet (Instagram, WhatsApp, etc.)
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Tchiki-Tchiki Results',
      text: 'Check out my Tchiki-Tchiki results!',
    });
    return;
  }

  // Desktop fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
