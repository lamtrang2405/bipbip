# Go-live Checklist

## Infrastructure
- [x] Create Supabase project (đang dùng cho dữ liệu hiện tại).
- [x] Run `supabase/schema.sql` + `migrations/20260423_stories_cms_columns.sql`.
- [x] Run `supabase/migrations/20261111_cms_taxonomy.sql` (danh mục, thể loại, import_jobs).
- [ ] Configure environment variables in Vercel (gồm `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain.

## Security
- [x] Set strong `ADMIN_PASSWORD`.
- [ ] Set `ADMIN_SESSION_SECRET` (chuỗi ngẫu nhiên dài).
- [x] Server Actions / trang admin kiểm tra phiên đăng nhập (`requireAdmin`).
- [ ] Restrict admin access path in monitoring alerts.
- [ ] Verify RLS policies with anonymous and admin users.
- [ ] Tắt chia sẻ công khai Google Sheet sau mỗi lần import.

## Content
- [x] Seed at least 10 stories and 30+ chapters (146 truyện / 731 chương).
- [ ] Bổ sung tác giả (143/146 truyện đang trống) và ảnh bìa (0/146) — có thể sửa hàng loạt qua `/admin/import` (tải dữ liệu hiện có, điền, import lại).
- [ ] Chọn truyện Đề cử cho trang chủ (hiện 0).
- [ ] Ensure each story has unique title, slug, and summary.
- [ ] Verify chapter ordering and prev/next navigation.

## Tracking
- [ ] Connect `/api/analytics` to storage or GA4.
- [ ] Validate event payloads for page/story/chapter/search.
- [ ] Create dashboard for chapter completion and retention.
