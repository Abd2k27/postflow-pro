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

    // Get TikTok account
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .eq('connected', true)
      .single();

    if (accountError || !account) throw new Error('TikTok account not connected');

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    
    // TikTok returns error.code = "ok" for success
    if (data.error && data.error.code !== 'ok') {
      return new Response(JSON.stringify({ 
        error: "TikTok API Error", 
        details: data.error,
        status: res.status 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
