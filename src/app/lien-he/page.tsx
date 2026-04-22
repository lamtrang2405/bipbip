import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Liên Hệ</h1>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Nếu bạn cần hỗ trợ kỹ thuật, góp ý nội dung hoặc liên hệ hợp tác, vui lòng gửi email cho đội
            ngũ Bíp Bíp Truyện.
          </p>
          <p>
            Email hỗ trợ:{" "}
            <Link
              href="mailto:support@bipbiptruyen.com"
              className="font-medium text-amber-700 underline-offset-2 hover:underline"
            >
              support@bipbiptruyen.com
            </Link>
          </p>
          <p>
            Chúng tôi sẽ phản hồi trong thời gian sớm nhất vào các ngày làm việc. Khi gửi yêu cầu, bạn
            vui lòng cung cấp mô tả rõ ràng để được hỗ trợ nhanh hơn.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
