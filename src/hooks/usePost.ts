import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Post, PlatformPost } from '@/types/post';

function toPlatformPost(row: any): PlatformPost {
  return {
    platform: row.platform,
    status: row.status,
    platformPostId: row.platform_post_id ?? undefined,
    errorMessage: row.error_message ?? undefined,
    publishedAt: row.published_at ?? undefined,
  };
}

function toPost(row: any): Post {
  return {
    id: row.id,
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    media: row.media_asset
      ? {
          id: row.media_asset.id,
          url: row.media_asset.url,
          type: row.media_asset.type,
          name: row.media_asset.name,
          size: row.media_asset.size,
          thumbnailUrl: row.media_asset.thumbnail_url ?? undefined,
        }
      : undefined,
    platformPosts: (row.platform_posts ?? []).map(toPlatformPost),
    scheduledAt: row.scheduled_at ?? undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          platform_posts (*),
          media_asset:media_assets!posts_media_id_fkey (*)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return toPost(data);
    },
    enabled: !!id,
  });
}
