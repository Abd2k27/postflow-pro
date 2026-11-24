-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- User platform keys (BYOK model)
CREATE TABLE public.user_platform_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('twitter','instagram','facebook','tiktok','youtube')),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  extra_config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.user_platform_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keys"
  ON public.user_platform_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys"
  ON public.user_platform_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys"
  ON public.user_platform_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys"
  ON public.user_platform_keys FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_platform_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
