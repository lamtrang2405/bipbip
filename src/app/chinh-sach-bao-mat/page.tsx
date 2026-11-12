import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Chính sách bảo mật", alternates: { canonical: "/chinh-sach-bao-mat" } };

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

        <section id="affiliate" className="mt-8 scroll-mt-20">
          <h2 className="text-lg font-semibold text-slate-900">Liên kết tiếp thị (affiliate)</h2>
          <div className="mt-3 space-y-4 text-sm leading-6 text-slate-700">
            <p>
              Một số nội dung trên Bíp Bíp Truyện là liên kết tiếp thị tới sản phẩm trên Shopee và được ghi rõ nhãn
              &quot;Liên kết tiếp thị&quot;. Khi bạn bấm vào và mua hàng, chúng tôi có thể nhận một khoản hoa hồng từ
              Shopee; giá bạn trả không thay đổi. Khoản này giúp duy trì web và giữ truyện miễn phí cho bạn đọc.
            </p>
            <p>
              Khi bạn bấm một liên kết tiếp thị, hệ thống ghi nhận lượt bấm một cách ẩn danh: liên kết nào, vị trí hiển
              thị, truyện/chương đang đọc và một mã băm (hash) của địa chỉ IP được trộn với khóa bí mật thay đổi theo
              ngày. Chúng tôi không lưu địa chỉ IP gốc và không dùng mã băm này để nhận diện cá nhân; mục đích duy nhất là
              thống kê và lọc lượt bấm trùng lặp hoặc từ bot.
            </p>
            <p>
              Để không hiển thị quảng cáo quá dày, trình duyệt của bạn lưu một số bộ đếm tần suất trong localStorage và
              sessionStorage (thời điểm hiển thị gần nhất, số lần trong ngày, số chương đã đọc trong phiên). Các dữ liệu
              này chỉ nằm trên thiết bị của bạn, không gửi về máy chủ và có thể xóa bất kỳ lúc nào bằng cách xóa dữ liệu
              trang web trong trình duyệt.
            </p>
            <p>
              Sau khi bạn rời sang Shopee, việc thu thập và xử lý dữ liệu tuân theo chính sách bảo mật của Shopee.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
