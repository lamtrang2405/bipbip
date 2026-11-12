# Go-live Checklist

## Infrastructure
- [x] Create Supabase project (đang dùng cho dữ liệu hiện tại).
- [x] Run `supabase/schema.sql` + `migrations/20260423_stories_cms_columns.sql`.
- [x] Run `supabase/migrations/20261111_cms_taxonomy.sql` (danh mục, thể loại, import_jobs).
- [x] Configure environment variables in Vercel (project `bipbip-clu1`; secret chỉ ở Production).
- [x] Set `NEXT_PUBLIC_SITE_URL` to production domain (`https://bipbip-clu1.vercel.app`).
- [x] Run `supabase/migrations/20261112_rls_hardening.sql`.
- [ ] Tắt bản deploy Railway cũ (`bipbip-production.up.railway.app`, thuộc tài khoản Railway của phongpn) — chạy code cũ, cookie admin giả mạo được.
- [x] Đổi key Supabase (12/11/2026): dùng `sb_publishable_…` / `sb_secret_…` (`bipbip_vercel_2026_11`), tắt key JWT cũ (anon, service_role).

## Security
- [x] Set strong `ADMIN_PASSWORD`.
- [x] Set `ADMIN_SESSION_SECRET` (chuỗi ngẫu nhiên dài).
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

## Runtime/Health
- [ ] Health endpoint `/api/health` returns `{"ok":true}`.
- [ ] (Nếu tự host) Docker image build + container start pass.

## Tracking
- [ ] Đặt `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_ADSENSE_CLIENT` / slot AdSense trên Vercel.
- [ ] Connect `/api/analytics` to storage or GA4.
- [ ] Validate event payloads for page/story/chapter/search.
- [ ] Create dashboard for chapter completion and retention.
