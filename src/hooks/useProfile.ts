import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  plan: string;
  postLimit: number;
  notifyPublish: boolean;
  notifyFailure: boolean;
  onboardingCompleted: boolean;
}

function toProfile(row: any): Profile {
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    avatarUrl: row.avatar_url,
    plan: row.plan,
    postLimit: row.post_limit,
    notifyPublish: row.notify_publish,
    notifyFailure: row.notify_failure,
    onboardingCompleted: row.onboarding_completed ?? false,
  };
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return toProfile(data);
    },
    enabled: !!user,
  });
}

export function useCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'displayName' | 'email' | 'notifyPublish' | 'notifyFailure'>>) => {
      const payload: any = {};
      if (updates.displayName !== undefined) payload.display_name = updates.displayName;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.notifyPublish !== undefined) payload.notify_publish = updates.notifyPublish;
      if (updates.notifyFailure !== undefined) payload.notify_failure = updates.notifyFailure;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteAccount() {
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // Use the delete-user Edge function to handle auth.users deletion
      const { data, error } = await supabase.functions.invoke('delete-user');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Sign out locally to clear session
      await signOut();
    },
  });
}
