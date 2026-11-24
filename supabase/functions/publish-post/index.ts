import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GRAPH, listPages } from '../_shared/meta.ts';
import { fetchTikTokPublishStatus, tiktokError } from '../_shared/tiktok.ts';

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
        // TikTok processes videos asynchronously: the post may still be processing
        let stillProcessing = false;

        try {
          if (pp.platform === 'twitter') {
            platformPostId = await publishToTwitter(post, account);
          } else if (pp.platform === 'instagram') {
            platformPostId = await publishToInstagram(post, account, supabaseAdmin);
          } else if (pp.platform === 'facebook') {
            platformPostId = await publishToFacebook(post, account, supabaseAdmin);
          } else if (pp.platform === 'tiktok') {
            const tiktok = await publishToTikTok(post, account, supabaseAdmin);
            platformPostId = tiktok.id;
            stillProcessing = tiktok.processing;
          } else if (pp.platform === 'youtube') {
            platformPostId = await publishToYouTube(post, account, supabaseAdmin);
          }

          await supabaseAdmin
            .from('platform_posts')
            .update({
              status: stillProcessing ? 'publishing' : 'published',
              platform_post_id: platformPostId,
              published_at: stillProcessing ? null : new Date().toISOString(),
              error_message: null,
            })
            .eq('id', pp.id);

          return { platform: pp.platform, success: true, processing: stillProcessing };
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
      const anyProcessing = outcomes.some((o: any) => o.processing);
      if (allSuccess && anyProcessing) {
        // TikTok still processing: tiktok-post-status finalizes the post later
        finalStatus = 'publishing';
      } else if (hasAssistedPending) {
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

async function signedMediaUrl(supabaseAdmin: any, storagePath: string): Promise<string> {
  // Signed URL valid for 1 hour (Meta downloads the file at publish time)
  const { data, error } = await supabaseAdmin.storage.from('media').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) throw new Error('Failed to generate a URL for the media file');
  return data.signedUrl;
}

function metadataFor(post: any, platform: string): any {
  return post.platform_posts.find((pp: any) => pp.platform === platform)?.metadata || {};
}

async function publishToInstagram(post: any, account: any, supabaseAdmin: any): Promise<string> {
  const caption = `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim();
  const mediaAsset = post.media;
  if (!mediaAsset?.storage_path) throw new Error('Instagram requires an image or video');

  const isVideo = mediaAsset.type === 'video';
  if (!isVideo && !/\.(jpe?g)$/i.test(mediaAsset.storage_path)) {
    throw new Error('Instagram only supports JPEG images. Please upload a .jpg file.');
  }

  // Instagram professional account chosen in the composer (or the only one available)
  const metadata = metadataFor(post, 'instagram');
  const igPages = (await listPages(account.access_token)).filter((p) => p.instagram);
  if (igPages.length === 0) throw new Error('No Instagram professional account linked to your Facebook Pages');
  const target = metadata.ig_account_id
    ? igPages.find((p) => p.instagram!.id === metadata.ig_account_id)
    : igPages.length === 1 ? igPages[0] : undefined;
  if (!target) throw new Error('Please select the Instagram account to publish to');
  const igAccountId = target.instagram!.id;

  const mediaUrl = await signedMediaUrl(supabaseAdmin, mediaAsset.storage_path);
  const mediaParams: any = { caption, access_token: account.access_token };
  if (isVideo) {
    mediaParams.video_url = mediaUrl;
    mediaParams.media_type = 'REELS';
  } else {
    mediaParams.image_url = mediaUrl;
  }

  // Create media container
  const containerRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mediaParams),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // Wait until the container is ready (videos take time to process)
  let status = isVideo ? 'IN_PROGRESS' : 'FINISHED';
  for (let attempts = 0; status !== 'FINISHED' && attempts < 40; attempts++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(`${GRAPH}/${container.id}?fields=status_code&access_token=${account.access_token}`);
    status = (await statusRes.json()).status_code;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error('Video processing failed on Instagram');
  }
  if (status !== 'FINISHED') throw new Error('Instagram is still processing the video, please retry in a few minutes');

  const publishRes = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: account.access_token }),
  });
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);
  return published.id;
}

async function publishToFacebook(post: any, account: any, supabaseAdmin: any): Promise<string> {
  const message = `${post.caption}\n\n${(post.hashtags ?? []).join(' ')}`.trim();

  // Page chosen in the composer (or the only one available)
  const metadata = metadataFor(post, 'facebook');
  const pages = await listPages(account.access_token);
  if (pages.length === 0) throw new Error('No Facebook Page found');
  const page = metadata.page_id
    ? pages.find((p) => p.id === metadata.page_id)
    : pages.length === 1 ? pages[0] : undefined;
  if (!page) throw new Error('Please select the Facebook Page to publish to');

  const mediaAsset = post.media;
  let endpoint = `${GRAPH}/${page.id}/feed`;
  const body: Record<string, unknown> = { access_token: page.access_token };

  if (mediaAsset?.storage_path) {
    const mediaUrl = await signedMediaUrl(supabaseAdmin, mediaAsset.storage_path);
    if (mediaAsset.type === 'video') {
      endpoint = `${GRAPH}/${page.id}/videos`;
      body.file_url = mediaUrl;
      body.description = message;
    } else {
      endpoint = `${GRAPH}/${page.id}/photos`;
      body.url = mediaUrl;
      body.caption = message;
    }
  } else {
    body.message = message;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.post_id ?? data.id;
}

async function publishToTikTok(post: any, account: any, _supabaseAdmin: any): Promise<{ id: string; processing: boolean }> {
  // TikTok Content Posting API (Direct Post) - video only
  const mediaAsset = post.media;
  if (!mediaAsset?.storage_path || mediaAsset.type !== 'video') {
    throw new Error('TikTok posting currently only supports videos');
  }

  const metadata = metadataFor(post, 'tiktok');
  // The user must pick the privacy level explicitly (TikTok guidelines: no default)
  if (!metadata.privacy_level) throw new Error('Missing TikTok privacy level');

  const postInfo: any = {
    title: post.caption.substring(0, 2200),
    privacy_level: metadata.privacy_level,
    disable_comment: metadata.allow_comments !== true,
    disable_duet: metadata.allow_duet !== true,
    disable_stitch: metadata.allow_stitch !== true,
  };

  // Commercial content disclosure
  if (metadata.content_disclosure_info) {
    postInfo.brand_organic_toggle = metadata.content_disclosure_info.brand_organic === true;
    postInfo.brand_content_toggle = metadata.content_disclosure_info.brand_content === true;
  }

  // Video served from our verified domain (Netlify proxy to Supabase Storage)
  const videoUrl = `${Deno.env.get('APP_URL')!}/media-proxy/${mediaAsset.storage_path}`;

  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: postInfo,
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
    }),
  });
  const initData = await initRes.json();
  const initError = tiktokError(initData);
  if (initError) throw new Error(`TikTok API error: ${initError}`);

  const publishId: string = initData.data?.publish_id;
  if (!publishId) throw new Error('TikTok did not return a publish_id');

  // Poll the status for ~1 minute; tiktok-post-status finishes tracking afterwards
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await fetchTikTokPublishStatus(account.access_token, publishId);
    if (st.state === 'complete') return { id: st.postId ?? publishId, processing: false };
    if (st.state === 'failed') throw new Error(`TikTok: ${st.reason}`);
  }
  return { id: publishId, processing: true };
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
