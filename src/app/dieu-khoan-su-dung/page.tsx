import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Điều khoản sử dụng", alternates: { canonical: "/dieu-khoan-su-dung" } };

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Điều Khoản Sử Dụng</h1>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Khi truy cập Bíp Bíp Truyện, bạn đồng ý tuân thủ các điều khoản sử dụng, bao gồm quy định
            về nội dung đăng tải, hành vi tương tác và quyền sở hữu trí tuệ.
          </p>
          <p>
            Người dùng không được sao chép, phát tán trái phép nội dung thuộc bản quyền của tác giả
            hoặc của nền tảng. Mọi hành vi lạm dụng hệ thống có thể dẫn đến giới hạn hoặc chặn truy cập.
          </p>
          <p>
            Website có hiển thị liên kết tiếp thị tới sản phẩm của bên thứ ba (Shopee). Chúng tôi không bán, không sở
            hữu và không chịu trách nhiệm về sản phẩm, giá, giao hàng hay bảo hành của bên thứ ba; mọi giao dịch thực
            hiện theo điều khoản của nền tảng đó. Xem thêm{" "}
            <Link href="/chinh-sach-bao-mat#affiliate" className="text-amber-700 hover:underline">
              chính sách về liên kết tiếp thị
            </Link>
            .
          </p>
          <p>
            Chúng tôi có quyền cập nhật điều khoản bất cứ lúc nào để đảm bảo chất lượng dịch vụ và tuân
            thủ quy định pháp luật hiện hành.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
