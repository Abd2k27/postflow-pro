import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SocialAccount, Platform } from '@/types/post';

function toSocialAccount(row: any): SocialAccount {
  return {
    id: row.id,
    platform: row.platform,
    username: row.username ?? '',
    avatarUrl: row.avatar_url ?? '',
    connected: row.connected,
    connectedAt: row.connected_at,
    connectionMode: row.connection_mode ?? 'assisted',
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
        .order('platform');
      if (error) throw error;
      return (data ?? []).map(toSocialAccount);
    },
    enabled: !!user,
  });
}

export function useEnableAssisted() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: Platform) => {
      const { error } = await supabase
        .from('social_accounts')
        .upsert(
          {
            user_id: user!.id,
            platform,
            connected: true,
            connection_mode: 'assisted',
            access_token: null,
            refresh_token: null,
            username: '',
            avatar_url: '',
          },
          { onConflict: 'user_id,platform' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDisableAssisted() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: Platform) => {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('user_id', user!.id)
        .eq('platform', platform)
        .eq('connection_mode', 'assisted');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
