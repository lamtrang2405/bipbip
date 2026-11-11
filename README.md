# NangTho Studio (Author-First MVP)

Web reading product similar to meokammap, optimized for personal story publishing first.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS.
- Supabase (Postgres/Auth/RLS-ready).
- Vercel deployment target.

## Local setup
1. Copy env:
   - `cp .env.example .env.local`
2. Update `.env.local` values (Supabase, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
3. Run dev server:
   - `npm run dev`

## MVP routes
- `/` home (featured/new/full)
- `/stories` listing + tag filter
- `/stories/[slug]` story detail
- `/stories/[slug]/[chapterSlug]` chapter reader
- `/search` search stories
- `/admin/login` admin authentication
- `/admin` admin CMS: tạo truyện nhiều chương, quản lý theo danh mục / theo truyện (lọc, bật tắt Xuất bản & Đề cử, xóa)
- `/admin/stories/[id]/edit` sửa toàn bộ metadata truyện (tiêu đề, slug, tác giả, tóm tắt, danh mục, thể loại, trạng thái, ảnh bìa, xuất bản, đề cử)
- `/admin/stories/[id]` quản lý chương
- `/admin/taxonomy` quản lý thể loại & danh mục (thêm, đổi tên, slug, thứ tự, ẩn/hiện, xóa)
- `/admin/import` import hàng loạt từ Google Sheet hoặc Excel

## Bảo mật admin
- Đăng nhập bằng `ADMIN_PASSWORD`; cookie phiên được ký HMAC bằng `ADMIN_SESSION_SECRET` (hết hạn sau 7 ngày). Thiếu `ADMIN_SESSION_SECRET` thì dùng `ADMIN_PASSWORD` làm khóa ký.
- Production bắt buộc đặt `ADMIN_PASSWORD` (không có giá trị mặc định).
- Mọi Server Action và trang admin đều gọi `requireAdmin()`.

## CMS storage
- **Khi bật Supabase** (đủ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`): truyện/chương/thể loại/danh mục lưu Postgres; ảnh bìa upload lên Storage bucket `covers` (public URL).
- **Khi chưa cấu hình Supabase**: fallback file local — `data/stories.json` và `public/uploads/covers`, chỉ hỗ trợ tạo truyện/chương. Sửa truyện, thể loại/danh mục và import cần Supabase.

### Thứ tự chạy SQL (Supabase SQL Editor)
- DB mới: chạy `supabase/schema.sql`.
- DB đang có dữ liệu, chạy lần lượt (mỗi file chạy lại nhiều lần vẫn an toàn):
  1. `supabase/migrations/20260423_stories_cms_columns.sql`
  2. `supabase/migrations/20261111_cms_taxonomy.sql` — tạo bảng `categories` (điền từ cột `stories.category`), thêm `stories.category_id`, thêm `sort_order`/`is_visible`/`description` cho `tags`, dọn tên thể loại bẩn (`"Hiện đại |"`), gộp thể loại trùng, seed danh sách thể loại mặc định, tạo bảng `import_jobs`.
- Chưa chạy migration thứ 2 thì admin hiện cảnh báo; trang public vẫn chạy (menu thể loại dùng danh sách tĩnh).
- Import dữ liệu cũ từ JSON: `npm run migrate:supabase` (Node 20+; đọc biến từ `.env.local`).

## Import Google Sheet / Excel (`/admin/import`)
1. Tải template tại `/admin/template/google-sheet` (hoặc `?data=1` để xuất toàn bộ truyện hiện có, sửa hàng loạt rồi import lại).
2. Tải lên Google Drive, mở bằng Google Trang tính, **Tệp > Lưu dưới dạng Google Trang tính**.
3. Điền tab `Truyen` (1 dòng/truyện) và `Chuong` (1 dòng/chương). Chi tiết từng cột ở tab `HuongDan`.
   - `Truyen`: `ma_truyen`*, `tieu_de`* (truyện mới), `tac_gia`, `tom_tat`, `the_loai` (phân cách dấu phẩy), `danh_muc`, `trang_thai` (Đang ra/Hoàn thành/Tạm ngưng), `tong_chuong_du_kien`, `anh_bia_url`, `xuat_ban`, `de_cu`.
   - `Chuong`: `ma_truyen`*, `so_chuong`*, `tieu_de_chuong`, `noi_dung`*, `xuat_ban`.
4. Chia sẻ "Bất kỳ ai có đường liên kết" (Người xem), dán link vào `/admin/import`, bấm **Kiểm tra** để xem trước rồi **Xác nhận import**.
5. Tắt chia sẻ công khai sau khi import.

Quy tắc:
- Trùng `ma_truyen` với truyện đã có = cập nhật; ô trống = giữ nguyên giá trị cũ; `the_loai` có giá trị = thay toàn bộ thể loại.
- Trùng `so_chuong` = ghi đè nội dung chương (giữ nguyên slug/URL chương).
- Thể loại / danh mục chưa có sẽ được tạo. Ảnh bìa (kể cả link Google Drive) được tải về bucket `covers`.
- Dòng lỗi bị bỏ qua, các dòng hợp lệ vẫn được ghi. Lịch sử lưu ở bảng `import_jobs`.
- Upload file `.xlsx` cùng template cũng dùng chung pipeline; định dạng Excel cũ (1 tab `title, author, ..., chapterTitle, chapterContent`) vẫn đọc được.

## Supabase schema and RLS
- SQL file: `supabase/schema.sql`
- Includes tables: categories, stories, chapters, tags, story_tags, story_metrics_daily, import_jobs
- Includes RLS for:
  - Public read only for published content and visible categories
  - Admin full CRUD using JWT role `admin`
- App ghi dữ liệu bằng service role (bỏ qua RLS) trong Server Actions đã kiểm tra `requireAdmin()`.

## Docs
- PRD: `docs/PRD-MVP.md`
- Go-live checklist: `docs/go-live-checklist.md`

## GitHub Pages HTML
- Entry: `docs/index.html`
- Story page: `docs/pages/web-truyen.html`
- CMS page: `docs/pages/cms.html`
