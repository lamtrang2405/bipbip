import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/repository";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const results = query ? await searchStories(query) : [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tìm kiếm truyện</h1>
        <form action="/search" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Nhập tên truyện, thể loại..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
          >
            Tìm
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </main>
    </div>
  );
}
