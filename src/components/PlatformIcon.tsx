import { Twitter, Instagram, Facebook, Music2, Youtube, Linkedin } from 'lucide-react';
import { Platform } from '@/types/post';

export const PlatformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  youtube: Youtube,
  linkedin: Linkedin,
};
