-- ============================================================
-- PostFlow Pro — Initial Schema
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  plan text not null default 'free',
  post_limit int not null default 10,
  notify_publish boolean not null default true,
  notify_failure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. SOCIAL ACCOUNTS
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('twitter','instagram','facebook','tiktok','youtube')),
  username text,
  avatar_url text,
  connected boolean not null default false,
  connected_at timestamptz,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  platform_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform)
);

alter table public.social_accounts enable row level security;

create policy "Users can view own accounts"
  on public.social_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.social_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.social_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.social_accounts for delete
  using (auth.uid() = user_id);

-- 3. POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null,
  hashtags text[] not null default '{}',
  media_id uuid,
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','scheduled','publishing','published','partial','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Users can view own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can create own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- 4. PLATFORM POSTS (per-platform status)
create table public.platform_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  platform text not null check (platform in ('twitter','instagram','facebook','tiktok','youtube')),
  status text not null default 'pending' check (status in ('pending','publishing','published','failed')),
  platform_post_id text,
  error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(post_id, platform)
);

alter table public.platform_posts enable row level security;

create policy "Users can view own platform posts"
  on public.platform_posts for select
  using (exists (
    select 1 from public.posts where posts.id = platform_posts.post_id and posts.user_id = auth.uid()
  ));

create policy "Users can insert own platform posts"
  on public.platform_posts for insert
  with check (exists (
    select 1 from public.posts where posts.id = platform_posts.post_id and posts.user_id = auth.uid()
  ));

create policy "Users can update own platform posts"
  on public.platform_posts for update
  using (exists (
    select 1 from public.posts where posts.id = platform_posts.post_id and posts.user_id = auth.uid()
  ));

-- 5. MEDIA ASSETS
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  storage_path text not null,
  type text not null check (type in ('image','video')),
  name text not null,
  size bigint not null default 0,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;

create policy "Users can view own media"
  on public.media_assets for select
  using (auth.uid() = user_id);

create policy "Users can upload own media"
  on public.media_assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own media"
  on public.media_assets for update
  using (auth.uid() = user_id);

create policy "Users can delete own media"
  on public.media_assets for delete
  using (auth.uid() = user_id);

-- Add foreign key from posts to media_assets
alter table public.posts
  add constraint posts_media_id_fkey
  foreign key (media_id) references public.media_assets(id) on delete set null;

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.social_accounts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.posts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.platform_posts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.media_assets
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RPC: get_dashboard_stats
-- ============================================================

create or replace function public.get_dashboard_stats(p_user_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_posts', (select count(*) from public.posts where user_id = p_user_id),
    'successful_posts', (select count(*) from public.posts where user_id = p_user_id and status = 'published'),
    'failed_posts', (select count(*) from public.posts where user_id = p_user_id and status = 'failed'),
    'scheduled_posts', (select count(*) from public.posts where user_id = p_user_id and status = 'scheduled')
  ) into result;
  return result;
end;
$$ language plpgsql security definer;

-- ============================================================
-- STORAGE: media bucket
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  104857600, -- 100MB
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
);

-- Storage RLS policies
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own media"
  on storage.objects for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own media"
  on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
