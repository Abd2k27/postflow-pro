import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { listPages } from '../_shared/meta.ts';

// Lists the Facebook Pages (and linked Instagram professional accounts) the user granted,
// so the composer can let them choose where to publish. Never returns Page tokens.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { platform } = await req.json().catch(() => ({ platform: 'facebook' }));

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: account } = await admin
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', platform === 'instagram' ? 'instagram' : 'facebook')
      .eq('connected', true)
      .maybeSingle();
    if (!account?.access_token) return json({ error: 'Account not connected' }, 400);

    const pages = await listPages(account.access_token);
    return json({
      pages: pages.map(({ access_token: _t, ...p }) => p),
    });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
});
