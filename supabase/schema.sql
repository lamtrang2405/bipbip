create extension if not exists pgcrypto;
create extension if not exists unaccent with schema extensions;

create or replace function public.cms_slugify(input text)
returns text
language sql
stable
as $$
  select btrim(
    regexp_replace(
      lower(extensions.unaccent(replace(replace(coalesce(input, ''), 'đ', 'd'), 'Đ', 'D'))),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-'
  )
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

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
  updated_at timestamptz not null default now(),
  author text,
  category text,
  category_id uuid references public.categories(id) on delete set null,
  completion_status text not null default 'ongoing' check (completion_status in ('ongoing', 'completed', 'hiatus')),
  total_chapters_planned int
);

create index if not exists stories_category_id_idx on public.stories(category_id);

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
  slug text unique not null,
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true
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

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('google_sheet', 'excel')),
  source_url text,
  status text not null check (status in ('success', 'partial', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists import_jobs_created_at_idx on public.import_jobs(created_at desc);

-- `stories.category` (text) là bản sao tên danh mục để trang public lọc/hiển thị không cần join.
create or replace function public.stories_sync_category_name()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null then
    select name into new.category from public.categories where id = new.category_id;
  elsif tg_op = 'UPDATE' and old.category_id is not null then
    new.category := null;
  end if;
  return new;
end;
$$;

drop trigger if exists stories_sync_category_name on public.stories;
create trigger stories_sync_category_name
  before insert or update of category_id on public.stories
  for each row execute function public.stories_sync_category_name();

create or replace function public.categories_propagate_name()
returns trigger
language plpgsql
as $$
begin
  update public.stories set category = new.name where category_id = new.id;
  return new;
end;
$$;

drop trigger if exists categories_propagate_name on public.categories;
create trigger categories_propagate_name
  after update of name on public.categories
  for each row execute function public.categories_propagate_name();

alter table public.categories enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.tags enable row level security;
alter table public.story_tags enable row level security;
alter table public.import_jobs enable row level security;
alter table public.story_metrics_daily enable row level security;

create index if not exists chapters_story_id_idx on public.chapters(story_id);

drop policy if exists "Public can read visible categories" on public.categories;
create policy "Public can read visible categories"
  on public.categories
  for select
  using (is_visible = true);

drop policy if exists "Public can read published stories" on public.stories;
create policy "Public can read published stories"
  on public.stories
  for select
  using (status = 'published');

drop policy if exists "Public can read published chapters" on public.chapters;
create policy "Public can read published chapters"
  on public.chapters
  for select
  using (
    is_published = true
    and exists (
      select 1 from public.stories s
      where s.id = chapters.story_id and s.status = 'published'
    )
  );

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags"
  on public.tags
  for select
  using (true);

drop policy if exists "Public can read story_tags" on public.story_tags;
create policy "Public can read story_tags"
  on public.story_tags
  for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_tags.story_id and s.status = 'published'
    )
  );

drop policy if exists "Public can read story metrics" on public.story_metrics_daily;
create policy "Public can read story metrics"
  on public.story_metrics_daily
  for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_metrics_daily.story_id and s.status = 'published'
    )
  );

drop policy if exists "Admin full access stories" on public.stories;
create policy "Admin full access stories"
  on public.stories
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "Admin full access chapters" on public.chapters;
create policy "Admin full access chapters"
  on public.chapters
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "Admin full access tags" on public.tags;
create policy "Admin full access tags"
  on public.tags
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "Admin full access story_tags" on public.story_tags;
create policy "Admin full access story_tags"
  on public.story_tags
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

insert into public.tags (name, slug, sort_order)
select v.name, public.cms_slugify(v.name), v.ord
from unnest(array[
  'Bách hợp', 'BE', 'Bình tĩnh cường', 'Chữa lành', 'Cổ đại', 'Cung đấu', 'Cứu rỗi', 'Đại Nữ Chủ',
  'Đam mỹ', 'Dị giới', 'Đời thường', 'Gia đình', 'Hài hước', 'Hậu cung', 'HE', 'Hiện đại',
  'Học đường', 'Kinh dị', 'Lịch sử', 'Ngược', 'Ngọt sủng', 'Ngôn tình', 'Nữ cường', 'Quân sự',
  'Sci-fi', 'Showbiz', 'Tình cảm hiện thực', 'Tiên hiệp', 'Trinh thám', 'Trọng sinh', 'Tổng tài',
  'Tu tiên', 'Văn phòng', 'Võ hiệp', 'Xuyên không'
]) with ordinality as v(name, ord)
on conflict (slug) do nothing;

-- Bucket ảnh bìa (public URL). Service role upload không cần policy ghi.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Shopee affiliate (cũng có trong migrations/20261114_affiliate.sql).
create table if not exists public.affiliate_placements (
  key text primary key check (key in ('chapter_end', 'story_detail', 'next_chapter_modal', 'chapter_unlock')),
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.affiliate_placements (key, config) values
  ('chapter_end', '{}'::jsonb),
  ('story_detail', '{}'::jsonb),
  ('next_chapter_modal', '{"every_n_chapters": 5, "min_chapter": 3, "cap_minutes": 180, "max_per_day": 3}'::jsonb),
  ('chapter_unlock', '{"min_chapter": 3, "ttl_minutes": 240, "max_per_day": 2, "skip_delay_seconds": 5, "rollout_percent": 20, "reveal_ratio": 0.3}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  network text not null default 'shopee' check (network = 'shopee'),
  title text not null,
  description text,
  image_url text,
  target_url text not null check (target_url ~ '^https://'),
  cta_label text not null default 'Xem ưu đãi trên Shopee',
  placements text[] not null default '{}'
    check (placements <@ array['chapter_end', 'story_detail', 'next_chapter_modal', 'chapter_unlock']::text[]),
  weight int not null default 10 check (weight between 1 and 100),
  story_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_links_is_active_idx on public.affiliate_links(is_active);

create table if not exists public.affiliate_clicks (
  id bigint generated always as identity primary key,
  link_id uuid references public.affiliate_links(id) on delete set null,
  placement text,
  story_id uuid references public.stories(id) on delete set null,
  chapter_number int,
  ip_hash text,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_created_link_idx on public.affiliate_clicks(created_at, link_id);
create index if not exists affiliate_clicks_dedupe_idx on public.affiliate_clicks(ip_hash, link_id, created_at desc);

alter table public.affiliate_placements enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;

drop policy if exists "Public can read affiliate placements" on public.affiliate_placements;
create policy "Public can read affiliate placements"
  on public.affiliate_placements
  for select
  using (true);

drop policy if exists "Public can read live affiliate links" on public.affiliate_links;
create policy "Public can read live affiliate links"
  on public.affiliate_links
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

-- `affiliate_clicks` không có policy public: chỉ service role đọc/ghi.
-- `security_invoker` để view tuân theo RLS của bảng gốc (anon không đọc được).
create or replace view public.affiliate_click_stats_7d
  with (security_invoker = true)
as
  select link_id, placement, count(*)::int as clicks
  from public.affiliate_clicks
  where created_at >= now() - interval '7 days' and is_bot = false
  group by link_id, placement;

revoke all on public.affiliate_click_stats_7d from anon, authenticated;
