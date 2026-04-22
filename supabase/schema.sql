create extension if not exists pgcrypto;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text not null,
  cover_url text,
  status text not null check (status in ('draft', 'published')) default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  chapter_number int not null,
  title text not null,
  slug text not null,
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, chapter_number),
  unique (story_id, slug)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table if not exists public.story_tags (
  story_id uuid not null references public.stories(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (story_id, tag_id)
);

create table if not exists public.story_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  metric_date date not null,
  views int not null default 0,
  unique_readers int not null default 0,
  created_at timestamptz not null default now(),
  unique (story_id, metric_date)
);

alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.tags enable row level security;
alter table public.story_tags enable row level security;

create policy "Public can read published stories"
  on public.stories
  for select
  using (status = 'published');

create policy "Public can read published chapters"
  on public.chapters
  for select
  using (is_published = true);

create policy "Public can read tags"
  on public.tags
  for select
  using (true);

create policy "Public can read story tags"
  on public.story_tags
  for select
  using (true);

create policy "Admin full access stories"
  on public.stories
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admin full access chapters"
  on public.chapters
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admin full access tags"
  on public.tags
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admin full access story tags"
  on public.story_tags
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
