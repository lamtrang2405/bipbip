import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { getHomeData } from "@/lib/repository";
import { AutoPageTracker } from "@/components/scripts/trackers";

export default async function Home() {
  const { featured, newest, full } = await getHomeData();
  return (
    <div className="min-h-screen">
      <AutoPageTracker />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-3 py-6 sm:px-4 sm:py-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-700 sm:text-xl">Đề cử</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {featured.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mới cập nhật</h2>
            <p className="text-sm text-slate-500 sm:text-base">Những truyện vừa có chương mới.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {newest.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-700 sm:text-xl">Truyện full</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {full.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
