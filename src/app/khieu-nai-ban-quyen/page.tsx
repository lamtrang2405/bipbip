import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Khiếu nại bản quyền", alternates: { canonical: "/khieu-nai-ban-quyen" } };

export default function CopyrightComplaintPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Khiếu Nại Bản Quyền</h1>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Bíp Bíp Truyện tôn trọng quyền sở hữu trí tuệ. Nếu bạn là chủ sở hữu bản quyền và phát hiện
            nội dung vi phạm, vui lòng gửi yêu cầu khiếu nại để chúng tôi xử lý.
          </p>
          <p>Thông tin cần cung cấp:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Thông tin liên hệ của chủ sở hữu hoặc người đại diện hợp pháp.</li>
            <li>Liên kết nội dung bị khiếu nại trên website.</li>
            <li>Mô tả căn cứ chứng minh quyền sở hữu bản quyền.</li>
          </ul>
          <p>
            Email tiếp nhận khiếu nại:{" "}
            <Link
              href="mailto:copyright@bipbiptruyen.com"
              className="font-medium text-amber-700 underline-offset-2 hover:underline"
            >
              copyright@bipbiptruyen.com
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
