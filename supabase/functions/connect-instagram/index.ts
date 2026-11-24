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

    const { redirect_path } = await req.json().catch(() => ({}));
    const appId = Deno.env.get('META_APP_ID')!;
    const appUrl = Deno.env.get('APP_URL')!;
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`;

    const state = btoa(JSON.stringify({
      user_id: user.id,
      platform: 'instagram',
      redirect_url: appUrl + (redirect_path ?? '/accounts'),
    }));

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list',
      response_type: 'code',
      state,
    });

    const url = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
