import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getStoriesByTheLoai } from "@/lib/repository";

type StoriesPageProps = {
  searchParams: Promise<{ "the-loai"?: string }>;
};

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const params = await searchParams;
  const stories = await getStoriesByTheLoai(params["the-loai"]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh sách truyện</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </main>
    </div>
  );
}
