-- Chặn đọc chương/thống kê của truyện chưa xuất bản (trước đây chương đã đăng của truyện nháp vẫn đọc được bằng anon key).
-- Chạy được nhiều lần.

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

alter table public.story_metrics_daily enable row level security;

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

create index if not exists chapters_story_id_idx on public.chapters(story_id);
