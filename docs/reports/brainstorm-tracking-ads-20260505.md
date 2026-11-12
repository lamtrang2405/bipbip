# Brainstorm Report: Tích hợp GA4 & AdSense (Goal B)

## 1. Bài toán & Yêu cầu (Problem Statement)
- **Mục tiêu:** Tích hợp hệ thống Analytics và hiển thị Quảng cáo (Ads) cho Bíp Bíp Truyện.
- **Quyết định:** Chọn **Phương án 2 (Client-side GA4 + Google AdSense)** theo yêu cầu của User.
- **Ràng buộc:** 
  - Đảm bảo tuân thủ nguyên tắc xin quyền (Consent) trước khi load bất kỳ script theo dõi nào.
  - Không phá vỡ UI UX hiện tại.
  - Không load script trong các trang quản trị (`/admin/*`).
  - Giữ nguyên contract của API `/api/analytics` hiện tại (trả về 200 OK) để không phá vỡ tính tương thích ngược, dù logic chính sẽ chuyển sang Client-side.

## 2. Thiết kế Kiến trúc (Solution Design)

### 2.1. Quản lý Consent (Consent Management)
- **Component:** `ConsentBanner` (fixed ở bottom màn hình).
- **Logic:** 
  - Lưu trạng thái vào `localStorage` (key: `bipbip_consent_status` = `'granted' | 'denied'`).
  - Sử dụng Context API (`ConsentProvider`) để cung cấp state này cho toàn bộ app một cách đồng bộ.
  - Hydration-safe: Render mặc định là ẩn ở lần render đầu (Server-side), sau đó load trạng thái từ localStorage.

### 2.2. Chiến lược Load Script (Script Injection)
- Sử dụng thẻ `<Script>` của Next.js (`next/script`) với `strategy="afterInteractive"`.
- Chỉ chèn thẻ script của GA4 và AdSense khi và chỉ khi `consentStatus === 'granted'`.
- Kiểm tra `pathname` (sử dụng `usePathname`), nếu bắt đầu bằng `/admin`, sẽ chặn hoàn toàn việc load script.

### 2.3. Event Tracking (GA4)
- **Component:** Hook `useTracking()`.
- Chứa các hàm tương ứng với các hành vi cốt lõi:
  - `trackStoryView(story)`
  - `trackChapterView(story, chapter)`
  - `trackSearch(query)`
  - `trackNextChapterClick()`
- Gửi event thông qua hàm `window.gtag('event', action, params)`.
- Nếu Adblocker chặn `gtag` hoặc `consent` bị từ chối, hook sẽ tự động fail-silently (không throw error, không làm crash app).

### 2.4. Google AdSense (Monetization)
- Tạo component `<AdSenseUnit adSlot="123456" format="auto" />`.
- Component này render thẻ `<ins className="adsbygoogle" ...></ins>`.
- Khởi tạo quảng cáo bằng cách gọi `(window.adsbygoogle = window.adsbygoogle || []).push({})` trong `useEffect` (chỉ gọi khi consent được cấp).

## 3. Rủi ro & Trade-offs
- **Adblockers:** Do sử dụng Client-side script hoàn toàn, tỉ lệ người dùng dùng Adblocker (uBlock, Brave) sẽ không hiển thị trên Dashboard GA4. Đây là sự đánh đổi đã được chấp nhận để giữ hệ thống đơn giản (KISS).
- **Duplicate Events trong React 19 (Strict Mode):** Cần thận trọng khi đặt `trackPageView` trong `useEffect` không có dependencies chuẩn, dễ dẫn đến double-firing. (Cách giải quyết: Kiểm tra cẩn thận dependencies array).
- **Layout Shift (CLS):** Quảng cáo tải chậm có thể đẩy text xuống dưới. (Cách giải quyết: set `min-height` cố định cho các `AdSenseUnit` placeholder).

## 4. Các bước tiếp theo (Next Steps)
1. Thống nhất Design này.
2. Sinh `plan.md` thông qua lệnh `/ck:plan`.
3. Bắt đầu implement `ConsentBanner`, `useTracking` và `AdSenseUnit`.
