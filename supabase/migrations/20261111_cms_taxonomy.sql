-- CMS: danh mục (categories), mở rộng thể loại (tags), lịch sử import.
-- Chạy được nhiều lần (idempotent). Chạy trong Supabase SQL Editor.

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

-- ---------------------------------------------------------------------------
-- Tags: thêm cột quản lý + dọn dữ liệu bẩn ("Hiện đại |", "| Xuyên Không", slug mất dấu)
-- ---------------------------------------------------------------------------
alter table public.tags add column if not exists description text;
alter table public.tags add column if not exists sort_order int not null default 0;
alter table public.tags add column if not exists is_visible boolean not null default true;

update public.tags set name = btrim(name, ' |') where name <> btrim(name, ' |');
delete from public.tags where name = '';

drop table if exists pg_temp.tag_merge;
create temp table tag_merge as
select
  id,
  first_value(id) over (partition by public.cms_slugify(name) order by id) as keep_id
from public.tags;

insert into public.story_tags (story_id, tag_id)
select st.story_id, m.keep_id
from public.story_tags st
join tag_merge m on m.id = st.tag_id
where m.id <> m.keep_id
on conflict do nothing;

delete from public.tags t
using tag_merge m
where t.id = m.id and m.id <> m.keep_id;

drop table if exists pg_temp.tag_merge;

update public.tags set slug = public.cms_slugify(name) where slug <> public.cms_slugify(name);

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

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Public can read visible categories" on public.categories;
create policy "Public can read visible categories"
  on public.categories
  for select
  using (is_visible = true);

insert into public.categories (name, slug)
select distinct on (public.cms_slugify(category)) btrim(category), public.cms_slugify(category)
from public.stories
where category is not null and btrim(category) <> ''
on conflict (slug) do nothing;

alter table public.stories
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists stories_category_id_idx on public.stories(category_id);

update public.stories s
set category_id = c.id
from public.categories c
where s.category_id is null
  and s.category is not null
  and c.slug = public.cms_slugify(s.category);

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

-- ---------------------------------------------------------------------------
-- Import jobs (chỉ service role đọc/ghi)
-- ---------------------------------------------------------------------------
create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('google_sheet', 'excel')),
  source_url text,
  status text not null check (status in ('success', 'partial', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.import_jobs enable row level security;

create index if not exists import_jobs_created_at_idx on public.import_jobs(created_at desc);

notify pgrst, 'reload schema';
