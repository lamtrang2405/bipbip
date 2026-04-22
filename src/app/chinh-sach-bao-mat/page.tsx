import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Chính Sách Bảo Mật</h1>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Bíp Bíp Truyện tôn trọng quyền riêng tư của người dùng. Chúng tôi chỉ thu thập các thông
            tin cần thiết để vận hành website, cải thiện trải nghiệm đọc truyện và hỗ trợ chăm sóc
            người dùng.
          </p>
          <p>
            Thông tin có thể bao gồm dữ liệu truy cập cơ bản, thao tác tìm kiếm và các nội dung bạn gửi
            qua biểu mẫu liên hệ. Chúng tôi không bán hoặc chia sẻ trái phép dữ liệu cá nhân cho bên thứ
            ba.
          </p>
          <p>
            Người dùng có thể yêu cầu chỉnh sửa hoặc xóa thông tin đã cung cấp bằng cách liên hệ qua
            trang Liên Hệ. Chính sách này có thể được cập nhật để phù hợp với thay đổi của dịch vụ.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
