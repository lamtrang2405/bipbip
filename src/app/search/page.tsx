import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/repository";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Tìm kiếm: ${q}` : "Tìm kiếm truyện",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const results = query ? await searchStories(query) : [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="text-2xl font-bold text-slate-900">Tìm kiếm truyện</h1>
        <form action="/search" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Nhập tên truyện, tác giả, thể loại..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-400"
          />
          <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white">
            Tìm
          </button>
        </form>

        {query ? (
          <p className="mt-4 text-sm text-slate-500">
            {results.length} kết quả cho &ldquo;{query}&rdquo;
          </p>
        ) : null}

        {results.length ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : query ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-slate-600">Không tìm thấy truyện phù hợp. Thử từ khóa ngắn hơn hoặc bỏ dấu.</p>
            <Link href="/stories" className="mt-3 inline-block text-sm font-medium text-amber-700 hover:underline">
              Xem tất cả truyện →
            </Link>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
