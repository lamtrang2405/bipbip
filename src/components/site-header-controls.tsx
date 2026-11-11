"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function SiteHeaderControls({ genres }: { genres: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTheLoai = searchParams.get("the-loai") ?? "";

  const searchDefault = useMemo(() => searchParams.get("q") ?? "", [searchParams]);

  const currentTheLoaiLabel = useMemo(() => {
    if (pathname !== "/stories") return "";
    if (!currentTheLoai) return "Tất cả";
    try {
      return decodeURIComponent(currentTheLoai);
    } catch {
      return currentTheLoai;
    }
  }, [pathname, currentTheLoai]);

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
      active
        ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/80 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-amber-700"
    }`;

  return (
    <div className="flex w-full flex-col gap-4 text-sm">
      <details className="group rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden dark:text-slate-100">
          <span>
            Thể Loại
            {pathname === "/stories" ? (
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {" "}
                — {currentTheLoaiLabel}
              </span>
            ) : null}
          </span>
          <span
            className="text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500"
            aria-hidden
          >
            ▼
          </span>
        </summary>
        <div className="border-t border-slate-200 px-3 pb-3 pt-2 dark:border-slate-600">
          <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
            <Link
              href="/stories"
              className={chipClass(pathname === "/stories" && !currentTheLoai)}
              scroll={false}
            >
              Tất cả
            </Link>
            {genres.map((name) => {
              const active =
                pathname === "/stories" &&
                decodeURIComponent(currentTheLoai).toLowerCase() === name.toLowerCase();
              return (
                <Link
                  key={name}
                  href={`/stories?the-loai=${encodeURIComponent(name)}`}
                  className={chipClass(active)}
                  scroll={false}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <form action="/search" className="flex flex-1 flex-wrap items-center gap-2 sm:min-w-[260px]">
          <input
            name="q"
            defaultValue={pathname === "/search" ? searchDefault : ""}
            placeholder="Tìm kiếm truyện..."
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-slate-900 px-3 py-2 font-medium text-white dark:bg-amber-600"
          >
            Tìm
          </button>
        </form>
      </div>
    </div>
  );
}
