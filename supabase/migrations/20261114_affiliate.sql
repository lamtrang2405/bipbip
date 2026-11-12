-- Shopee affiliate MVP: vị trí hiển thị, link tiếp thị và log click ẩn danh.
-- Chạy được nhiều lần.

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
