import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { getStoriesByCategory, getStoriesByTheLoai } from "@/lib/repository";

const PAGE_SIZE = 24;

type StoriesSearchParams = { "the-loai"?: string; "danh-muc"?: string; trang?: string };

type StoriesPageProps = {
  searchParams: Promise<StoriesSearchParams>;
};

function describeFilter(params: StoriesSearchParams) {
  if (params["the-loai"]) return { kind: "Thể loại", value: params["the-loai"] };
  if (params["danh-muc"]) return { kind: "Danh mục", value: params["danh-muc"] };
  return null;
}

export async function generateMetadata({ searchParams }: StoriesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const filter = describeFilter(params);
  return {
    title: filter ? `Truyện ${filter.value}` : "Danh sách truyện",
    description: filter
      ? `Đọc truyện ${filter.kind.toLowerCase()} ${filter.value} online miễn phí, cập nhật liên tục.`
      : "Danh sách truyện đọc online miễn phí, cập nhật liên tục.",
    alternates: { canonical: "/stories" },
  };
}

function pageHref(params: StoriesSearchParams, page: number) {
  const query = new URLSearchParams();
  if (params["the-loai"]) query.set("the-loai", params["the-loai"]);
  if (params["danh-muc"]) query.set("danh-muc", params["danh-muc"]);
  if (page > 1) query.set("trang", String(page));
  const qs = query.toString();
  return qs ? `/stories?${qs}` : "/stories";
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const params = await searchParams;
  const filter = describeFilter(params);
  const stories = params["the-loai"]
    ? await getStoriesByTheLoai(params["the-loai"])
    : await getStoriesByCategory(params["danh-muc"]);

  const totalPages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.trang ?? "1", 10) || 1));
  const pageStories = stories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {filter ? `${filter.kind}: ${filter.value}` : "Danh sách truyện"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {stories.length} truyện{totalPages > 1 ? ` · Trang ${page}/${totalPages}` : ""}
        </p>

        {pageStories.length ? (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {pageStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-slate-600">
              {filter ? `Chưa có truyện nào thuộc ${filter.kind.toLowerCase()} "${filter.value}".` : "Chưa có truyện nào."}
            </p>
            {filter ? (
              <Link href="/stories" className="mt-3 inline-block text-sm font-medium text-amber-700 hover:underline">
                Xem tất cả truyện →
              </Link>
            ) : null}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Phân trang">
            {page > 1 ? (
              <Link href={pageHref(params, page - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">
                ← Trước
              </Link>
            ) : null}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(params, n)}
                aria-current={n === page ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  n === page ? "bg-amber-500 font-semibold text-white" : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {n}
              </Link>
            ))}
            {page < totalPages ? (
              <Link href={pageHref(params, page + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">
                Sau →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
