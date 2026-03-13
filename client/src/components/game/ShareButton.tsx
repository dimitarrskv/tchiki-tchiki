import { useState } from 'react';
import { generateShareCard, type ShareCardData } from '../../lib/shareCard';
import { shareImage } from '../../lib/shareImage';

interface ShareButtonProps {
  data: ShareCardData;
}

export function ShareButton({ data }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const blob = await generateShareCard(data);
      await shareImage(blob);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      // User cancelled the share sheet - not an error
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Share failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isGenerating}
      className="w-full bg-bg-card border-2 border-secondary text-secondary font-mono py-3 px-4 rounded-lg hover:bg-secondary/10 transition-all uppercase tracking-wide text-sm disabled:opacity-50 shadow-[0_0_15px_rgba(255,0,110,0.3)] hover:shadow-[0_0_25px_rgba(255,0,110,0.5)]"
    >
      {isGenerating
        ? '> Generating...'
        : showSuccess
          ? '> Shared!'
          : '> Share Results'}
    </button>
  );
}
