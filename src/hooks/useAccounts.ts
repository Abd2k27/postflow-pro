import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SocialAccount } from '@/types/post';

function toSocialAccount(row: any): SocialAccount {
  return {
    id: row.id,
    platform: row.platform,
    username: row.username ?? '',
    avatarUrl: row.avatar_url ?? '',
    connected: row.connected,
    connectedAt: row.connected_at,
    connectionMode: row.connection_mode ?? 'auto',
  };
}

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('connection_mode', 'auto')
        .order('platform');
      if (error) throw error;
      return (data ?? []).map(toSocialAccount);
    },
    enabled: !!user,
  });
}

