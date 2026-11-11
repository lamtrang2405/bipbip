-- Chạy trên DB Supabase đã tồn tại bảng `stories` cũ (thiếu cột CMS).
alter table public.stories add column if not exists author text;
alter table public.stories add column if not exists category text;
alter table public.stories add column if not exists total_chapters_planned int;
alter table public.stories add column if not exists completion_status text;

update public.stories
set completion_status = 'ongoing'
where completion_status is null;

alter table public.stories alter column completion_status set default 'ongoing';

alter table public.stories
  alter column completion_status set not null;

alter table public.stories drop constraint if exists stories_completion_status_check;

alter table public.stories
  add constraint stories_completion_status_check
  check (completion_status in ('ongoing', 'completed', 'hiatus'));

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

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
  on storage.objects for select
  using (bucket_id = 'covers');
