import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { post_id, platform } = await req.json();
    if (!post_id || !platform) throw new Error('Missing post_id or platform');

    // Ownership check (RLS on the user-scoped client hides other users' posts)
    const { data: ownPost } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!ownPost) throw new Error('Post not found');

    // Reset the platform_post status to pending
    const { error } = await supabase
      .from('platform_posts')
      .update({ status: 'pending', error_message: null })
      .eq('post_id', post_id)
      .eq('platform', platform);

    if (error) throw error;

    // Trigger publish for just this platform via the publish function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Re-invoke publish-post which will handle all pending platform_posts
    await supabaseAdmin.functions.invoke('publish-post', {
      body: { post_id },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
