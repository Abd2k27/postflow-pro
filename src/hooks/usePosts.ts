import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, PlatformPost, Platform } from '@/types/post';

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

export function usePosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          platform_posts (*),
          media_asset:media_assets!posts_media_id_fkey (*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toPost);
    },
    enabled: !!user,
  });
}

interface CreatePostInput {
  caption: string;
  hashtags: string[];
  platforms: Platform[];
  assistedPlatforms: Platform[];
  scheduledAt?: string;
  mediaId?: string;
  platformMetadata?: Record<string, any>;
}

interface CreatePostResult {
  post: any;
  assistedPlatforms: Platform[];
}

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput): Promise<CreatePostResult> => {
      const allPlatforms = [...input.platforms, ...input.assistedPlatforms];
      const hasAuto = input.platforms.length > 0;
      const status = input.scheduledAt ? 'scheduled' : 'publishing';

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user!.id,
          caption: input.caption,
          hashtags: input.hashtags,
          media_id: input.mediaId ?? null,
          scheduled_at: input.scheduledAt ?? null,
          status,
        })
        .select()
        .single();

      if (postError) throw postError;

      const platformRows = [
        ...input.platforms.map((platform) => ({
          post_id: post.id,
          platform,
          status: 'pending' as const,
          metadata: input.platformMetadata?.[platform] ?? {},
        })),
        ...input.assistedPlatforms.map((platform) => ({
          post_id: post.id,
          platform,
          status: 'awaiting_confirmation' as const,
          metadata: input.platformMetadata?.[platform] ?? {},
        })),
      ];

      if (platformRows.length > 0) {
        const { error: ppError } = await supabase
          .from('platform_posts')
          .insert(platformRows);
        if (ppError) throw ppError;
      }

      // Only call publish edge function if there are auto platforms
      if (!input.scheduledAt && input.platforms.length > 0) {
        supabase.functions.invoke('publish-post', {
          body: { post_id: post.id },
        });
      }

      return { post, assistedPlatforms: input.assistedPlatforms };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useConfirmAssistedPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      platform,
      confirmed,
    }: {
      postId: string;
      platform: Platform;
      confirmed: boolean;
    }) => {
      if (confirmed) {
        const { error } = await supabase
          .from('platform_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('post_id', postId)
          .eq('platform', platform);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_posts')
          .update({
            status: 'failed',
            error_message: 'Skipped by user',
          })
          .eq('post_id', postId)
          .eq('platform', platform);
        if (error) throw error;
      }

      // Recalculate overall post status
      const { data: platformPosts } = await supabase
        .from('platform_posts')
        .select('status')
        .eq('post_id', postId);

      if (platformPosts) {
        const statuses = platformPosts.map((pp: any) => pp.status);
        const hasAwaiting = statuses.includes('awaiting_confirmation');
        const hasPending = statuses.includes('pending');
        const hasPublishing = statuses.includes('publishing');

        if (!hasAwaiting && !hasPending && !hasPublishing) {
          const allPublished = statuses.every((s: string) => s === 'published');
          const allFailed = statuses.every((s: string) => s === 'failed');
          const finalStatus = allPublished
            ? 'published'
            : allFailed
              ? 'failed'
              : 'partial';

          await supabase
            .from('posts')
            .update({ status: finalStatus })
            .eq('id', postId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previous = queryClient.getQueryData<Post[]>(['posts']);
      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        old?.filter((p) => p.id !== postId)
      );
      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['posts'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
