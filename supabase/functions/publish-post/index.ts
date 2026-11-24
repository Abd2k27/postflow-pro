import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Callers: the frontend (user JWT) or other edge functions / cron (service key).
  // verify_jwt is off for this function (see config.toml): the new sb_secret_ keys are not JWTs
  // and supabase-js sends them in the `apikey` header only, so auth is checked here.
  // A user may only publish their own posts.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const isServiceCall = req.headers.get('apikey') === serviceKey || token === serviceKey;
  let callerId: string | null = null;
  if (!isServiceCall) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    callerId = user.id;
  }

  try {
    const { post_id } = await req.json();
    if (!post_id) throw new Error('Missing post_id');

    // Get the post with platform_posts and media
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('*, platform_posts(*), media:media_assets(*)')
      .eq('id', post_id)
      .single();
    if (postError || !post) throw new Error('Post not found');
    if (callerId && post.user_id !== callerId) throw new Error('Post not found');

    // Get user's connected accounts
    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', post.user_id)
      .eq('connected', true);

    const accountMap = new Map((accounts ?? []).map((a: any) => [a.platform, a]));

    // Update post status to publishing
    await supabaseAdmin.from('posts').update({ status: 'publishing' }).eq('id', post_id);

    // Filter out assisted (awaiting_confirmation) platform posts
    const autoPlatformPosts = (post.platform_posts ?? []).filter(
      (pp: any) => pp.status !== 'awaiting_confirmation'
    );

    // Publish to each auto platform in parallel
    const results = await Promise.allSettled(
      autoPlatformPosts.map(async (pp: any) => {
        const account = accountMap.get(pp.platform);
        if (!account) {
          throw new Error(`No connected account for ${pp.platform}`);
        }

        // Mark as publishing
        await supabaseAdmin
          .from('platform_posts')
          .update({ status: 'publishing' })
          .eq('id', pp.id);

        let platformPostId: string | null = null;

        try {
          if (pp.platform === 'twitter') {
            platformPostId = await publishToTwitter(post, account);
          } else if (pp.platform === 'instagram') {
            platformPostId = await publishToInstagram(post, account, supabaseAdmin);
          } else if (pp.platform === 'facebook') {
            platformPostId = await publishToFacebook(post, account);
          } else if (pp.platform === 'tiktok') {
            platformPostId = await publishToTikTok(post, account, supabaseAdmin);
          } else if (pp.platform === 'youtube') {
            platformPostId = await publishToYouTube(post, account, supabaseAdmin);
          }

          await supabaseAdmin
            .from('platform_posts')
            .update({
              status: 'published',
              platform_post_id: platformPostId,
              published_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', pp.id);

          return { platform: pp.platform, success: true };
        } catch (err) {
          await supabaseAdmin
            .from('platform_posts')
            .update({
              status: 'failed',
              error_message: err.message,
            })
            .eq('id', pp.id);

          return { platform: pp.platform, success: false, error: err.message };
        }
      })
    );

    // Determine overall post status (only for auto platforms)
    const outcomes = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { success: false }
    );
    const hasAssistedPending = (post.platform_posts ?? []).some(
      (pp: any) => pp.status === 'awaiting_confirmation'
    );

    let finalStatus: string;
    if (outcomes.length === 0) {
      // All platforms are assisted — keep as publishing until user confirms
      finalStatus = 'publishing';
    } else {
      const allSuccess = outcomes.every((o: any) => o.success);
      const allFailed = outcomes.every((o: any) => !o.success);
      if (hasAssistedPending) {
        // Mixed mode: auto done but assisted still pending
        finalStatus = allSuccess ? 'publishing' : 'partial';
      } else {
        finalStatus = allSuccess ? 'published' : allFailed ? 'failed' : 'partial';
      }
    }

    await supabaseAdmin.from('posts').update({ status: finalStatus }).eq('id', post_id);

    return new Response(JSON.stringify({ status: finalStatus, results: outcomes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function publishToTwitter(post: any, account: any): Promise<string> {
  const caption = `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim();

  // Get metadata
  const platformPost = post.platform_posts.find((pp: any) => pp.platform === 'twitter');
  const metadata = platformPost?.metadata || {};

  const body: any = { text: caption };
  if (metadata.reply_settings) {
    body.reply_settings = metadata.reply_settings;
  }

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.title || 'Twitter API error');
  return data.data.id;
}

async function publishToInstagram(post: any, account: any, supabaseAdmin: any): Promise<string> {
  const caption = `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim();
  const mediaAsset = post.media;
  if (!mediaAsset?.storage_path) throw new Error('Instagram requires an image or video');

  // Create a signed URL for the media (valid for 1 hour)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from('media')
    .createSignedUrl(mediaAsset.storage_path, 3600);
  
  if (signedError || !signedData?.signedUrl) {
    throw new Error('Failed to generate signed URL for Instagram');
  }
  const mediaUrl = signedData.signedUrl;

  // Get Instagram Business Account ID via pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${account.access_token}`
  );
  const pages = await pagesRes.json();
  const page = pages.data?.[0];
  if (!page) throw new Error('No Facebook Page found');

  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${account.access_token}`
  );
  const igData = await igRes.json();
  const igAccountId = igData.instagram_business_account?.id;
  if (!igAccountId) throw new Error('No Instagram Business Account linked');

  const isVideo = mediaAsset.type === 'video';
  const mediaParams: any = {
    caption,
    access_token: account.access_token,
  };

  if (isVideo) {
    mediaParams.video_url = mediaUrl;
    mediaParams.media_type = 'REELS';
  } else {
    mediaParams.image_url = mediaUrl;
  }

  // Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaParams),
    }
  );
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // For videos, we need to wait for processing
  if (isVideo) {
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status !== 'FINISHED' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${container.id}?fields=status_code&access_token=${account.access_token}`
      );
      const statusData = await statusRes.json();
      status = statusData.status_code;
      if (status === 'ERROR') throw new Error('Video processing failed on Instagram');
      attempts++;
    }
  }

  // Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: account.access_token,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);
  return published.id;
}

async function publishToFacebook(post: any, account: any): Promise<string> {
  const message = `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim();

  // Get metadata
  const platformPost = post.platform_posts.find((pp: any) => pp.platform === 'facebook');
  const metadata = platformPost?.metadata || {};

  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${account.access_token}`
  );
  const pages = await pagesRes.json();
  const page = pages.data?.[0];
  if (!page) throw new Error('No Facebook Page found');

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: page.access_token,
        privacy: metadata.privacy ? { value: metadata.privacy } : undefined,
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.id;
}

async function publishToTikTok(post: any, account: any, supabaseAdmin: any): Promise<string> {
  // TikTok Content Posting API - video only
  const mediaAsset = post.media;
  if (!mediaAsset?.storage_path || mediaAsset.type !== 'video') {
    throw new Error('TikTok posting currently only supports videos');
  }

  // Get TikTok metadata from platform_posts
  const tiktokPost = post.platform_posts.find((pp: any) => pp.platform === 'tiktok');
  const metadata = tiktokPost?.metadata || {};

  const postInfo: any = {
    title: post.caption.substring(0, 150),
    privacy_level: metadata.privacy_level || 'PUBLIC_TO_EVERYONE',
  };

  // Add interaction settings
  if (metadata.allow_comments !== undefined) postInfo.disable_comment = !metadata.allow_comments;
  if (metadata.allow_duet !== undefined) postInfo.disable_duet = !metadata.allow_duet;
  if (metadata.allow_stitch !== undefined) postInfo.disable_stitch = !metadata.allow_stitch;

  // Add branded content disclosure
  if (metadata.content_disclosure_info) {
    const labels = [];
    if (metadata.content_disclosure_info.brand_organic) labels.push('BRAND_ORGANIC');
    if (metadata.content_disclosure_info.brand_content) labels.push('BRAND_CONTENT');
    
    if (labels.length > 0) {
      postInfo.content_disclosure_info = {
        self_disclosure_video_types: labels
      };
    }
  }

  // Required flags for TikTok API v2
  postInfo.content_preview_confirmed = true;
  postInfo.express_consent_given = true;

  // Construct the proxy URL (your verified domain)
  // We use APP_URL (ex: https://ton-domaine.com) + /media-proxy/ + filename
  const appUrl = Deno.env.get('APP_URL')!;
  const videoUrl = `${appUrl}/media-proxy/${mediaAsset.storage_path}`;

  console.log('Publishing to TikTok via PULL_FROM_URL:', videoUrl);

  // Step 1: Initialize the upload using PULL_FROM_URL
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: postInfo,
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
      post_mode: 'DIRECT_POST',
      media_type: 'VIDEO'
    }),
  });

  const initData = await initRes.json();
  if (initData.error?.code) {
    console.error('TikTok Init Error:', initData.error);
    throw new Error(`TikTok API error: ${initData.error.message} (Code: ${initData.error.code})`);
  }

  const publishId = initData.data?.publish_id;
  console.log('TikTok pull request accepted, publish_id:', publishId);
  return publishId;
}

async function publishToYouTube(post: any, account: any, supabaseAdmin: any): Promise<string> {
  if (!post.media?.storage_path) throw new Error('No video attached to post');

  // Get metadata
  const platformPost = post.platform_posts.find((pp: any) => pp.platform === 'youtube');
  const metadata = platformPost?.metadata || {};

  // Download video from Supabase Storage using admin client
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from('media')
    .download(post.media.storage_path);
  if (downloadError || !fileData) throw new Error('Failed to download video from storage');
  const videoBlob = fileData;
  // Infer content type from file extension
  const ext = (post.media.storage_path ?? '').split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  };
  const contentType = mimeMap[ext ?? ''] || 'video/mp4';

  const metadata_yt = {
    snippet: {
      title: metadata.title || post.caption.substring(0, 100),
      description: `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim(),
      categoryId: '22', // People & Blogs
    },
    status: {
      privacyStatus: metadata.privacy || 'public',
      selfDeclaredMadeForKids: metadata.madeForKids || false,
    },
  };

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(videoBlob.size),
        'X-Upload-Content-Type': contentType,
      },
      body: JSON.stringify(metadata_yt),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json();
    throw new Error(err.error?.message || 'Failed to initiate YouTube upload');
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('No upload URL returned by YouTube');

  // Step 2: Upload the video file
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(videoBlob.size),
    },
    body: videoBlob,
  });

  const data = await uploadRes.json();
  if (!uploadRes.ok || data.error) {
    throw new Error(data.error?.message || 'YouTube video upload failed');
  }

  return data.id ?? '';
}
