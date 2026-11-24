import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code || !stateParam) {
    return new Response('Missing code or state', { status: 400 });
  }

  let state: {
    user_id: string;
    platform: string;
    code_verifier?: string;
    redirect_url: string;
  };

  try {
    state = JSON.parse(atob(stateParam));
  } catch {
    return new Response('Invalid state', { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`;

  try {
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let username = '';
    let platformUserId = '';
    let avatarUrl = '';

    if (state.platform === 'twitter') {
      const clientId = Deno.env.get('TWITTER_CLIENT_ID')!;
      const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')!;

      const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: state.code_verifier ?? '',
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
      expiresIn = tokens.expires_in;

      const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json();
      username = `@${userData.data.username}`;
      platformUserId = userData.data.id;
      avatarUrl = userData.data.profile_image_url ?? '';

    } else if (state.platform === 'instagram' || state.platform === 'facebook') {
      const appId = Deno.env.get('META_APP_ID')!;
      const appSecret = Deno.env.get('META_APP_SECRET')!;

      const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }));
      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error.message);
      accessToken = tokens.access_token;
      expiresIn = tokens.expires_in;

      // Exchange for long-lived token
      const longRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: accessToken,
      }));
      const longTokens = await longRes.json();
      if (longTokens.access_token) {
        accessToken = longTokens.access_token;
        expiresIn = longTokens.expires_in ?? 5184000; // ~60 days
      }

      const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`);
      const me = await meRes.json();
      username = me.name ?? '';
      platformUserId = me.id;
      avatarUrl = me.picture?.data?.url ?? '';

    } else if (state.platform === 'tiktok') {
      const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')!;
      const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!;

      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error.message || tokens.error);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
      expiresIn = tokens.expires_in;
      platformUserId = tokens.open_id ?? '';

      const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json();
      username = `@${userData.data?.user?.display_name ?? ''}`;
      avatarUrl = userData.data?.user?.avatar_url ?? '';

    } else if (state.platform === 'youtube') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
      expiresIn = tokens.expires_in;

      const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      username = channel?.snippet?.title ?? '';
      platformUserId = channel?.id ?? '';
      avatarUrl = channel?.snippet?.thumbnails?.default?.url ?? '';
    } else {
      throw new Error(`Unsupported platform: ${state.platform}`);
    }

    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabaseAdmin
      .from('social_accounts')
      .upsert({
        user_id: state.user_id,
        platform: state.platform,
        username,
        avatar_url: avatarUrl,
        connected: true,
        connected_at: new Date().toISOString(),
        connection_mode: 'auto',
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        platform_user_id: platformUserId,
      }, {
        onConflict: 'user_id,platform',
      });

    if (upsertError) throw upsertError;

    return Response.redirect(state.redirect_url, 302);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorUrl = `${state.redirect_url}?error=${encodeURIComponent(err.message)}`;
    return Response.redirect(errorUrl, 302);
  }
});
