import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TikTokCreatorInfo {
  creator_nickname: string;
  creator_avatar_url: string;
  daily_user_posting_limit: {
    max_posts: number;
    remaining_posts: number;
  };
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

export function useTikTokCreatorInfo() {
  return useQuery({
    queryKey: ['tiktok-creator-info'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-tiktok-creator-info');
      if (error) throw error;
      return data as TikTokCreatorInfo;
    },
    // TikTok guidelines: fetch the latest creator info each time the post page is rendered
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
