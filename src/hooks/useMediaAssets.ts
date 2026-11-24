import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MediaAsset } from '@/types/post';

function toMediaAsset(row: any): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    type: row.type,
    name: row.name,
    size: row.size,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    storagePath: row.storage_path,
  };
}

export function useMediaAssets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['media', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toMediaAsset);
    },
    enabled: !!user,
  });
}

export function useUploadMedia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) throw new Error('Unsupported file type');

      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      const { data, error: insertError } = await supabase
        .from('media_assets')
        .insert({
          user_id: user!.id,
          url: publicUrl,
          storage_path: path,
          type: isImage ? 'image' : 'video',
          name: file.name,
          size: file.size,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      return toMediaAsset(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from('media').remove([storagePath]);
      const { error } = await supabase.from('media_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}
