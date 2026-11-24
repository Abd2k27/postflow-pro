-- Add metadata column to platform_posts for platform-specific settings
alter table public.platform_posts add column if not exists metadata jsonb default '{}'::jsonb;

-- Also ensure social_accounts has creator_info cache if needed, 
-- but maybe it's better to fetch live or store it in social_accounts.
alter table public.social_accounts add column if not exists platform_settings jsonb default '{}'::jsonb;
