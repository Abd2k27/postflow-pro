-- Phase 1: Assisted Mode Migration

-- Add 'linkedin' to social_accounts.platform CHECK constraint
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'));

-- Add 'linkedin' to platform_posts.platform CHECK constraint
ALTER TABLE platform_posts DROP CONSTRAINT IF EXISTS platform_posts_platform_check;
ALTER TABLE platform_posts ADD CONSTRAINT platform_posts_platform_check
  CHECK (platform IN ('twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'));

-- Add connection_mode column to social_accounts
ALTER TABLE social_accounts
  ADD COLUMN connection_mode TEXT NOT NULL DEFAULT 'assisted'
  CHECK (connection_mode IN ('assisted', 'auto'));

-- Add 'awaiting_confirmation' to platform_posts.status CHECK constraint
ALTER TABLE platform_posts DROP CONSTRAINT IF EXISTS platform_posts_status_check;
ALTER TABLE platform_posts ADD CONSTRAINT platform_posts_status_check
  CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'awaiting_confirmation'));

-- Migrate existing accounts: those with access_token are auto mode
UPDATE social_accounts SET connection_mode = 'auto' WHERE access_token IS NOT NULL;
