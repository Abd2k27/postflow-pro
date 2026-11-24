import type { Platform } from '@/types/post';
import { toast } from 'sonner';

export function buildPublishText(caption: string, hashtags: string[]): string {
  const parts = [caption, hashtags.join(' ')].filter(Boolean);
  return parts.join('\n\n');
}

async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function openAssistedPlatform(
  platform: Platform,
  caption: string,
  hashtags: string[]
): Promise<void> {
  const text = buildPublishText(caption, hashtags);
  const encoded = encodeURIComponent(text);

  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
      break;

    case 'facebook':
      window.open(
        `https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,
        '_blank'
      );
      break;

    case 'linkedin':
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://postflow.pro')}&summary=${encoded}`,
        '_blank'
      );
      break;

    case 'instagram':
      await copyToClipboard(text);
      toast.info('Caption copied to clipboard! Paste it on Instagram.');
      window.open('https://instagram.com/', '_blank');
      break;

    case 'tiktok':
      await copyToClipboard(text);
      toast.info('Caption copied to clipboard! Paste it on TikTok.');
      window.open('https://tiktok.com/upload', '_blank');
      break;

    case 'youtube':
      await copyToClipboard(text);
      toast.info('Caption copied to clipboard! Paste it on YouTube Studio.');
      window.open('https://studio.youtube.com/', '_blank');
      break;
  }
}
