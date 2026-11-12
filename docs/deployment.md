# Deployment

## Vercel (production hiện tại)
- Project: `bipbip-clu1` (team `ge's projects`), nối GitHub `lamtrang2405/bipbip`, nhánh production `main`.
- URL: https://bipbip-clu1.vercel.app
- Mỗi lần push `main` tự build & deploy. Push nhánh khác tạo bản preview (có Vercel Authentication).

### Biến môi trường
| Biến | Môi trường | Ghi chú |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Đọc dữ liệu public qua RLS |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | Domain production (sitemap, robots) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Chỉ Production** | Quyền ghi DB, bỏ qua RLS |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | **Chỉ Production** | Đăng nhập & ký phiên admin |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_CHAPTER_TOP`, `NEXT_PUBLIC_ADSENSE_SLOT_CHAPTER_BOTTOM` | Production | Để trống = tắt |

Secret đặt kiểu **Sensitive**. Đổi biến xong phải redeploy để có hiệu lực.

### Rollback
Vercel Dashboard > Project > Deployments > chọn bản ổn định > **Promote to Production**.

## Docker (tùy chọn, tự host)
```
docker build -t bipbip-web .
docker run --rm -p 3000:3000 --env-file .env.local bipbip-web
```
Health check: `GET /api/health` trả `{"ok":true}`.

Chỉ chạy thêm một bản deploy nếu thật sự cần, và luôn dùng code mới nhất của `main`: mọi bản deploy có `SUPABASE_SERVICE_ROLE_KEY` đều có quyền ghi database.
