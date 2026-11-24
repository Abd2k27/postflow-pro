-- Le frontend utilise getPublicUrl() et TikTok (PULL_FROM_URL) lit les vidéos via
-- /media-proxy -> /storage/v1/object/public/media : le bucket doit être public.
update storage.buckets set public = true where id = 'media';
