import Link from "next/link";

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-amber-700">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm">
                🐥
              </span>
              <span className="text-base font-semibold">Bíp Bíp Truyện</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              Truy cập website đồng nghĩa bạn đã đồng ý với
              <Link
                href="/dieu-khoan-su-dung"
                className="ml-1 font-medium text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
              >
                Điều Khoản Sử Dụng
              </Link>
              .
            </p>
          </div>

          <FooterColumn
            title="Thông tin"
            links={[
              { href: "/chinh-sach-bao-mat", label: "Chính Sách Bảo Mật" },
              { href: "/dieu-khoan-su-dung", label: "Điều Khoản Sử Dụng" },
              { href: "/lien-he", label: "Liên Hệ" },
              { href: "/khieu-nai-ban-quyen", label: "Khiếu Nại Bản Quyền" },
            ]}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright @ {currentYear} Bíp Bíp Truyện. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/chinh-sach-bao-mat" className="hover:text-slate-700 dark:hover:text-slate-200">
              Bảo Mật
            </Link>
            <Link href="/dieu-khoan-su-dung" className="hover:text-slate-700 dark:hover:text-slate-200">
              Điều Khoản
            </Link>
            <Link href="/lien-he" className="hover:text-slate-700 dark:hover:text-slate-200">
              Liên Hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-slate-700 transition hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-400"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
