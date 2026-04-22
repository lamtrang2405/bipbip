# Project Next Steps (Go-live + Tracking/Ads)

## Context
Hiện trạng project:
- Next.js 16 + React 19, chạy bằng `npm run dev/build/start` (`package.json`).
- Chưa có `Dockerfile`, chưa có `.env.example`, chưa có pipeline deploy rõ ràng cho Railway/Cloudflare.
- CMS đang lưu local file (`src/lib/cms-store.ts`) và ảnh vào local disk (`src/lib/admin-actions.ts`) => không phù hợp môi trường production stateless.
- Có Supabase schema (`supabase/schema.sql`) và client wrapper (`src/lib/supabase/*`) nhưng repository chưa dùng DB thật.
- Tracking API còn placeholder (`src/app/api/analytics/route.ts`), chưa có GA/GTM/consent.
- Chưa có AdSense/AdMob integration.

---

## Goal 1 — Deploy web/server để go-live

### 1) Chuẩn hoá cấu hình môi trường
**Làm gì**
- Tạo `.env.example` (biến bắt buộc):
  - `ADMIN_PASSWORD`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - (dành chỗ cho analytics/ads ở Goal 2)
- Cập nhật `README.md` và `docs/go-live-checklist.md` theo Railway/Cloudflare, bỏ assumption Vercel.

**File chính**
- `README.md`
- `docs/go-live-checklist.md`
- `.env.example` (new)

### 2) Đóng gói deploy bằng Docker (ưu tiên Railway)
**Làm gì**
- Thêm `Dockerfile` multi-stage cho `next build` + `next start`.
- (Tuỳ chọn) thêm `docker-compose.yml` để test local production-like.

**File chính**
- `Dockerfile` (new)
- `docker-compose.yml` (optional, new)

### 3) Chuyển persistence sang Supabase (blocker trước go-live)
**Làm gì**
- Dừng phụ thuộc `data/stories.json` và local uploads.
- Refactor tầng repository để đọc/ghi qua Supabase.
- Chuyển cover upload sang Supabase Storage (hoặc object storage bền vững).

**File chính**
- `src/lib/cms-store.ts` (remove/replace responsibility)
- `src/lib/repository.ts`
- `src/lib/admin-actions.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `supabase/schema.sql` (nếu cần mở rộng)

### 4) Hardening production tối thiểu
**Làm gì**
- Không cho fallback `ADMIN_PASSWORD="changeme"` ở production (`src/lib/auth.ts`).
- Thêm health endpoint.

**File chính**
- `src/lib/auth.ts`
- `src/app/api/health/route.ts` (new)

---

## Goal 2 — Cắm tracking + Google ads

### 1) Hoàn thiện tracking backend
**Làm gì**
- Reuse event contract hiện có tại `src/lib/analytics.ts`.
- Implement `POST /api/analytics` để lưu event thật:
  - Ưu tiên: Supabase events table.
  - Hoặc: GA4 Measurement Protocol.

**File chính**
- `src/lib/analytics.ts` (reuse)
- `src/app/api/analytics/route.ts`
- `supabase/schema.sql` (thêm analytics table nếu chọn Supabase)

### 2) Cắm event ở các điểm chính
**Làm gì**
- Track chuẩn cho: home, listing, story detail, chapter view, search, next chapter click.
- Chống double-fire trong client navigation.

**File chính**
- `src/app/page.tsx`
- `src/app/stories/page.tsx`
- `src/app/stories/[slug]/page.tsx`
- `src/app/stories/[slug]/[chapterSlug]/page.tsx`
- `src/app/search/page.tsx`
- helper tracking mới trong `src/lib/*`

### 3) Consent + AdSense
**Làm gì**
- Thêm consent banner trước khi load tracking/ads scripts.
- Cắm AdSense cho web trước (vị trí: list/story/chapter, không cắm admin pages).
- AdMob: tách phase sau (chỉ hợp lý nếu có app mobile/native wrapper).

**File chính**
- `src/app/layout.tsx`
- component consent + ads slots mới trong `src/components/*`

---

## Thứ tự ưu tiên thực thi (khuyến nghị)
1. Env + Docker + docs deploy.
2. Migration persistence sang Supabase + Storage.
3. Hardening + healthcheck + staging deploy Railway.
4. Implement tracking backend + client events.
5. Consent + AdSense rollout.
6. Đánh giá lại nhu cầu AdMob (phase mobile).

---

## Verification (bắt buộc trước “done”)
1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. `npm run start` + smoke test routes chính và admin flow.
5. Docker build/run local thành công.
6. Staging Railway deploy pass + smoke test end-to-end.
7. Tracking events xuất hiện ở đích lưu (Supabase/GA4 debug).
8. AdSense chỉ load khi có consent, không phá layout mobile/desktop.
