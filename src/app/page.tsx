import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { getHomeData } from "@/lib/repository";
import { AutoPageTracker } from "@/components/scripts/trackers";
import { StoryWithChapters } from "@/types/story";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function StorySection({
  title,
  subtitle,
  stories,
  moreHref,
  moreLabel = "Xem tất cả",
}: {
  title: string;
  subtitle?: string;
  stories: StoryWithChapters[];
  moreHref?: string;
  moreLabel?: string;
}) {
  if (!stories.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {moreHref ? (
          <Link href={moreHref} className="shrink-0 text-sm font-medium text-amber-700 hover:underline">
            {moreLabel} →
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const { total, featured, newest, completed, categories } = await getHomeData();
  return (
    <div className="min-h-screen">
      <AutoPageTracker />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-3 py-6 sm:px-4 sm:py-8">
        <StorySection title="Đề cử" stories={featured} />
        <StorySection
          title="Mới cập nhật"
          subtitle="Những truyện vừa có chương mới."
          stories={newest}
        />
        <StorySection title="Truyện đã hoàn thành" stories={completed} />
        {categories.map((category) => (
          <StorySection
            key={category.name}
            title={category.name}
            subtitle={`${category.total} truyện`}
            stories={category.stories}
            moreHref={category.total > category.stories.length ? `/stories?danh-muc=${encodeURIComponent(category.name)}` : undefined}
          />
        ))}
        {total === 0 ? <p className="py-16 text-center text-slate-500">Chưa có truyện nào được đăng.</p> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
