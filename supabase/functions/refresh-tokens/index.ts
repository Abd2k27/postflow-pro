import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function should be invoked by a cron job every 6 hours
serve(async (req) => {
  // Only the pg_cron job may call this function (header x-cron-secret, see migration 007)
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Find accounts with tokens expiring within 24 hours
    const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: accounts, error } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('connected', true)
      .not('refresh_token', 'is', null)
      .lt('token_expires_at', expiryThreshold);

    if (error) throw error;
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ refreshed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.allSettled(
      accounts.map(async (account: any) => {
        try {
          let newAccessToken: string;
          let newRefreshToken: string | null = null;
          let expiresIn: number;

          if (account.platform === 'twitter') {
            const clientId = Deno.env.get('TWITTER_CLIENT_ID')!;
            const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')!;

            const res = await fetch('https://api.twitter.com/2/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: account.refresh_token,
              }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            newAccessToken = data.access_token;
            newRefreshToken = data.refresh_token ?? account.refresh_token;
            expiresIn = data.expires_in;

          } else if (account.platform === 'tiktok') {
            const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')!;
            const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!;

            const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: account.refresh_token,
              }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message || data.error);
            newAccessToken = data.access_token;
            newRefreshToken = data.refresh_token ?? account.refresh_token;
            expiresIn = data.expires_in;

          } else if (account.platform === 'youtube') {
            const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
            const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

            const res = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: account.refresh_token,
              }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error_description || data.error);
            newAccessToken = data.access_token;
            newRefreshToken = account.refresh_token; // Google doesn't rotate refresh tokens
            expiresIn = data.expires_in;

          } else {
            // Instagram/Facebook long-lived tokens last 60 days; refresh separately
            return;
          }

          await supabaseAdmin
            .from('social_accounts')
            .update({
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
              token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            })
            .eq('id', account.id);

        } catch (err) {
          console.error(`Failed to refresh ${account.platform} for user ${account.user_id}:`, err);
          throw err;
        }
      })
    );

    const refreshed = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ refreshed, failed, total: accounts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
