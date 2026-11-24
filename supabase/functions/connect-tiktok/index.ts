import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { signState, safeRedirectUrl } from '../_shared/oauthState.ts';

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
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')!;
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`;

    const csrfState = crypto.randomUUID();
    const state = await signState({
      user_id: user.id,
      platform: 'tiktok',
      csrf: csrfState,
      redirect_url: safeRedirectUrl(redirect_path),
    });

    const params = new URLSearchParams({
      client_key: clientKey,
      scope: 'user.info.basic,video.publish',
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });

    const url = `https://www.tiktok.com/v2/auth/authorize/?${params}`;

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
