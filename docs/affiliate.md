# Shopee Affiliate (MVP)

Hiển thị link tiếp thị Shopee trong trang đọc truyện, có giới hạn tần suất, ghi nhận click ẩn danh và trang quản trị `/admin/affiliate`.

## Vị trí hiển thị

| Key | Nơi hiện | Cấu hình mặc định |
| --- | --- | --- |
| `chapter_end` | Thẻ sản phẩm ngay sau nội dung chương (AdSense dưới cùng được dời xuống dưới thanh điều hướng chương) | — |
| `story_detail` | Thẻ sản phẩm phía trên danh sách chương | — |
| `next_chapter_modal` | Bấm "Chương tiếp" mở popup sản phẩm; nút chính mở Shopee ở tab mới và tab hiện tại tự sang chương sau, nút "Đọc tiếp" chỉ chuyển chương | `every_n_chapters: 5, min_chapter: 3, cap_minutes: 180, max_per_day: 3` |
| `chapter_unlock` | Soft gate: thu gọn phần sau của chương bằng lớp mờ, mở khi bấm Shopee hoặc nút "Đọc tiếp" (hiện sau vài giây) | `min_chapter: 3, ttl_minutes: 240, max_per_day: 2, skip_delay_seconds: 5, rollout_percent: 20, reveal_ratio: 0.3` |

Mọi vị trí mặc định **tắt**. Một vị trí chỉ hiện khi đã bật và có ít nhất một link đang chạy (bật, trong lịch) chọn vị trí đó.

Chọn link: mỗi vị trí ưu tiên link nhắm đúng truyện, sau đó link nhắm đúng danh mục, cuối cùng là link chung (không nhắm). Trong nhóm được chọn, client bốc ngẫu nhiên theo `weight`.

### Quy tắc soft gate (`chapter_unlock`)

Chỉ hiện khi **tất cả** điều kiện đúng:

- Vị trí đang bật và có link.
- `rolloutBucket()` (số 0–99 cố định theo trình duyệt) `< rollout_percent`.
- Số chương `>= min_chapter`.
- Chưa hiện gate trong `ttl_minutes` gần nhất và chưa vượt `max_per_day` (ngày theo giờ Việt Nam).
- Trang không phải trang đầu tiên của phiên đến từ máy tìm kiếm (Google, Bing, Cốc Cốc, …).

Nội dung chương luôn có đầy đủ trong HTML (SSR) cho bot và người đọc; gate chỉ dùng CSS `max-height` + lớp mờ, không xóa nội dung, không tự mở tab, không chặn nút Back. Khi gate hiện trên một trang, AdSense phía trên chương bị ẩn trong lượt xem đó và thẻ `chapter_end` cũng ẩn; popup chương tiếp không hiện trên trang có gate.

### Lưu trữ phía trình duyệt

- `localStorage["bipbip_aff_v1"]`: `{ bucket, placements: { [key]: { lastShownAt, day, countToday } } }`.
- `sessionStorage["bipbip_aff_chapters"]`: số chương đã đọc trong phiên (reset khi popup chương tiếp hiện).
- `sessionStorage["bipbip_aff_landing"]`: trang đầu của phiên và có đến từ máy tìm kiếm hay không.

## Redirect & log click

`/go/{linkId}?p={placement}&s={storyId}&c={chapterNumber}`

- Chỉ nhận `id` là UUID, `p` thuộc 4 key trên, `s` là UUID (tùy chọn), `c` là số nguyên dương (tùy chọn). Sai → 302 về `/`.
- Không bao giờ nhận URL đích từ query: URL lấy từ DB (service role), kiểm tra lại trạng thái bật/lịch và allowlist trước khi redirect 302.
- Header `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`; `robots.txt` disallow `/go`.
- Log click chạy trong `after()` (không làm chậm redirect): `ip_hash = sha256(ip | salt | YYYY-MM-DD)`, bỏ qua nếu cùng `ip_hash` + link trong 30 giây. Bot (`userAgent().isBot` hoặc UA chứa bot/crawl/spider/preview/facebookexternalhit/zalo, hoặc UA rỗng) vẫn được redirect nhưng log `is_bot = true` và không tính vào thống kê.
- Link đích được dùng trong HTML chỉ là `/go/...`, client không bao giờ nhận `target_url`.

## Biến môi trường mới

| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `AFFILIATE_IP_SALT` | Nên có | Chuỗi ngẫu nhiên dài (`openssl rand -base64 32`). Nếu trống dùng `ADMIN_SESSION_SECRET`; nếu cả hai trống thì không lưu `ip_hash` (không chống trùng click). |
| `AFFILIATE_ALLOWED_HOSTS` | Không | Danh sách tên miền bổ sung, cách nhau bởi dấu phẩy. Mặc định: `s.shopee.vn, shope.ee, shopee.vn` (gồm cả subdomain). |

Thêm vào Vercel (Production + Preview) và `.env.local` khi chạy local.

## Cài đặt

1. Mở Supabase → SQL Editor, chạy toàn bộ file `supabase/migrations/20261114_affiliate.sql` (chạy lại nhiều lần không sao). File tạo:
   - `affiliate_placements` (seed 4 vị trí, đều tắt),
   - `affiliate_links`, `affiliate_clicks`,
   - view `affiliate_click_stats_7d` (`security_invoker`, đã revoke quyền anon/authenticated),
   - RLS: public chỉ đọc được link đang bật + trong lịch và bảng placement; `affiliate_clicks` không có policy public.
2. Đặt `AFFILIATE_IP_SALT` trên Vercel rồi redeploy.
3. Vào `/admin/affiliate`:
   - Thêm link: tiêu đề, link affiliate Shopee (`https://s.shopee.vn/...`), ảnh vuông (upload vào bucket `covers` thư mục `affiliate/` hoặc dán link ảnh https), chọn vị trí, trọng số, (tùy chọn) slug truyện / danh mục / lịch chạy.
   - Bật từng vị trí ở mục "Vị trí hiển thị" và chỉnh thông số. Nên bật `chapter_end` + `story_detail` trước, sau đó `next_chapter_modal`, cuối cùng `chapter_unlock` với `rollout_percent` thấp.
4. Trang public cập nhật sau tối đa ~60 giây (ISR).

Khi chưa chạy migration hoặc chưa cấu hình Supabase, mọi trang public vẫn chạy bình thường và không hiện gì liên quan affiliate; trang admin hiện banner nhắc chạy migration.

## Checklist kiểm thử

- [ ] Chưa migration: trang chương/truyện không có thẻ affiliate, `/admin/affiliate` hiện banner migration.
- [ ] `curl -sI /go/khong-phai-uuid` → 302 `Location: /`, có `X-Robots-Tag: noindex`.
- [ ] `curl -s /robots.txt` có `Disallow: /go`.
- [ ] HTML chương (`curl -s /stories/{slug}/{chapter}`) chứa đầy đủ nội dung, không chứa `shopee.vn` (chỉ `/go/...`).
- [ ] Thêm link với URL ngoài allowlist (vd. `https://evil.com`, `http://shopee.vn`, `https://shopee.vn:8443`) → báo lỗi.
- [ ] Bật `chapter_end` → thẻ hiện sau chương, nhãn "Liên kết tiếp thị", mở tab mới, `rel="sponsored nofollow noopener"`.
- [ ] Click → bản ghi trong `affiliate_clicks` (`ip_hash` có giá trị, `is_bot = false`); click lại trong 30 giây không tạo bản ghi mới.
- [ ] `curl -A "Googlebot" /go/{id}?p=chapter_end` → vẫn 302, bản ghi `is_bot = true`.
- [ ] Popup chương tiếp: đọc ≥ `every_n_chapters` chương trong phiên (từ chương `min_chapter`) → bấm "Chương tiếp" mở popup; nút Shopee mở đúng 1 tab mới và tab hiện tại sang chương sau; "Đọc tiếp" chỉ chuyển chương; Ctrl/⌘-click không bị chặn.
- [ ] Soft gate (đặt `rollout_percent = 100`, `min_chapter = 1` để test): phần sau chương bị làm mờ, AdSense trên chương không hiện, nút "Đọc tiếp" xuất hiện sau `skip_delay_seconds` khi khung gate vào màn hình; mở từ Google (referrer) không bị gate ở trang đầu.
- [ ] GA4 DebugView (sau khi đồng ý cookie): `affiliate_impression`, `affiliate_click`, `affiliate_modal_shown`, `affiliate_gate_shown`, `affiliate_gate_skip`.
- [ ] Thống kê 7 ngày trong admin khớp số click không phải bot.

## Hạn chế đã biết

- Giới hạn tần suất lưu ở trình duyệt nên có thể bị xóa/khác nhau giữa thiết bị; không có giới hạn phía server.
- Lịch chạy chính xác trong khoảng ±60 giây do ISR.
- Thống kê chỉ có click (không có đơn hàng/hoa hồng; cần đối soát trong Shopee Affiliate dashboard).
- Ảnh dán link ngoài được hiển thị trực tiếp (không rehost).
