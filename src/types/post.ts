export type Platform = 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin';

export type ConnectionMode = 'assisted' | 'auto';

export type PublishStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'awaiting_confirmation';

export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  avatarUrl: string;
  connected: boolean;
  connectedAt?: string;
  connectionMode: ConnectionMode;
}

export interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  thumbnailUrl?: string;
  storagePath?: string;
}

export interface PlatformPost {
  platform: Platform;
  status: PublishStatus;
  platformPostId?: string;
  errorMessage?: string;
  publishedAt?: string;
}

export interface Post {
  id: string;
  caption: string;
  hashtags: string[];
  media?: MediaAsset;
  platformPosts: PlatformPost[];
  scheduledAt?: string;
  createdAt: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'partial' | 'failed';
}

export interface DashboardStats {
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
  scheduledPosts: number;
}

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string }> = {
  twitter: { label: 'X (Twitter)', color: 'platform-twitter' },
  instagram: { label: 'Instagram', color: 'platform-instagram' },
  facebook: { label: 'Facebook', color: 'platform-facebook' },
  tiktok: { label: 'TikTok', color: 'platform-tiktok' },
  youtube: { label: 'YouTube Shorts', color: 'platform-youtube' },
  linkedin: { label: 'LinkedIn', color: 'platform-linkedin' },
};

export const PLATFORM_MODE_SUPPORT: Record<Platform, ConnectionMode[]> = {
  twitter: ['assisted', 'auto'],
  instagram: ['assisted', 'auto'],
  facebook: ['assisted', 'auto'],
  tiktok: ['assisted', 'auto'],
  youtube: ['assisted', 'auto'],
  linkedin: ['assisted'],
};
