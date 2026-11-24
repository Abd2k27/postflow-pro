import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchTikTokPublishStatus } from '../_shared/tiktok.ts';

// Refreshes the status of a TikTok post that is still processing (called by the post page).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { post_id } = await req.json();
    if (!post_id) return json({ error: 'Missing post_id' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: post } = await admin
      .from('posts')
      .select('id, user_id, platform_posts(*)')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!post) return json({ error: 'Post not found' }, 404);

    const pp = (post.platform_posts ?? []).find((p: any) => p.platform === 'tiktok');
    if (!pp || pp.status !== 'publishing' || !pp.platform_post_id) {
      return json({ status: pp?.status ?? null });
    }

    const { data: account } = await admin
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .maybeSingle();
    if (!account?.access_token) return json({ error: 'TikTok account not connected' }, 400);

    const st = await fetchTikTokPublishStatus(account.access_token, pp.platform_post_id);
    if (st.state === 'processing') return json({ status: 'publishing' });

    const update = st.state === 'complete'
      ? { status: 'published', published_at: new Date().toISOString(), error_message: null,
          platform_post_id: st.postId ?? pp.platform_post_id }
      : { status: 'failed', error_message: `TikTok: ${st.reason}` };
    await admin.from('platform_posts').update(update).eq('id', pp.id);

    // Recompute the overall post status
    const { data: all } = await admin.from('platform_posts').select('status').eq('post_id', post_id);
    const statuses = (all ?? []).map((r: any) => r.status);
    let postStatus = 'publishing';
    if (!statuses.some((s: string) => s === 'publishing' || s === 'pending' || s === 'awaiting_confirmation')) {
      const ok = statuses.filter((s: string) => s === 'published').length;
      postStatus = ok === statuses.length ? 'published' : ok === 0 ? 'failed' : 'partial';
    }
    await admin.from('posts').update({ status: postStatus }).eq('id', post_id);

    return json({ status: update.status });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
});
