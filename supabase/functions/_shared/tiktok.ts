// TikTok Content Posting API helpers

export type TikTokPublishState =
  | { state: 'processing' }
  | { state: 'complete'; postId: string | null }
  | { state: 'failed'; reason: string };

/** TikTok returns error.code === "ok" on success. */
export function tiktokError(body: any): string | null {
  const code = body?.error?.code;
  if (!code || code === 'ok') return null;
  return `${body.error.message || 'TikTok API error'} (Code: ${code})`;
}

/** https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status */
export async function fetchTikTokPublishStatus(accessToken: string, publishId: string): Promise<TikTokPublishState> {
  const res = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const body = await res.json();
  const err = tiktokError(body);
  if (err) throw new Error(err);

  const status = body.data?.status;
  if (status === 'PUBLISH_COMPLETE') {
    const ids = body.data?.publicaly_available_post_id ?? [];
    return { state: 'complete', postId: ids.length ? String(ids[0]) : null };
  }
  if (status === 'FAILED') {
    return { state: 'failed', reason: body.data?.fail_reason || 'TikTok could not publish the video' };
  }
  // PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, SEND_TO_USER_INBOX
  return { state: 'processing' };
}
