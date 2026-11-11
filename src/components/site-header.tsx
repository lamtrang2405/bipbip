import Link from "next/link";
import { Suspense } from "react";
import { SiteHeaderControls } from "@/components/site-header-controls";
import { listVisibleTagNames } from "@/lib/taxonomy";

export async function SiteHeader() {
  const genres = await listVisibleTagNames();
  return (
    <header className="border-b border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="mb-3">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-700">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg">
              🐥
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-wide">Bíp Bíp Truyện</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Bíp Bíp Truyện
              </span>
            </span>
          </Link>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <SiteHeaderControls genres={genres} />
        </Suspense>
      </div>
    </header>
  );
}
