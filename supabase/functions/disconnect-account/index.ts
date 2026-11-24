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

    const { account_id } = await req.json();
    if (!account_id) throw new Error('Missing account_id');

    // Get account to check ownership and revoke tokens
    const { data: account, error: fetchError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) throw new Error('Account not found');

    // Attempt to revoke token (best effort)
    if (account.access_token) {
      try {
        if (account.platform === 'twitter') {
          await fetch('https://api.twitter.com/2/oauth2/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${btoa(`${Deno.env.get('TWITTER_CLIENT_ID')}:${Deno.env.get('TWITTER_CLIENT_SECRET')}`)}`,
            },
            body: new URLSearchParams({ token: account.access_token }),
          });
        }
        // Other platforms: Meta and Google don't have simple revoke endpoints from server
      } catch {
        // Token revocation is best-effort
      }
    }

    // Mark as disconnected and clear tokens
    const { error: updateError } = await supabase
      .from('social_accounts')
      .update({
        connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
      })
      .eq('id', account_id);

    if (updateError) throw updateError;

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
