-- Migration to remove BYOK (Bring Your Own Key) model
DROP TABLE IF EXISTS public.user_platform_keys;
