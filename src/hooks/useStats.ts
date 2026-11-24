import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DashboardStats } from '@/types/post';

export function useStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      const raw = data as any;
      return {
        totalPosts: raw.total_posts ?? 0,
        successfulPosts: raw.successful_posts ?? 0,
        failedPosts: raw.failed_posts ?? 0,
        scheduledPosts: raw.scheduled_posts ?? 0,
      } as DashboardStats;
    },
    enabled: !!user,
  });
}
