import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getStoryBySlug } from "@/lib/repository";

type StoryDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const chapters = story.chapters
    .filter((chapter) => chapter.isPublished)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {story.coverUrl ? (
            <div className="absolute inset-0 opacity-10">
              <Image src={story.coverUrl} alt={story.title} fill className="object-cover blur-sm" />
            </div>
          ) : null}
          <div className="relative grid gap-4 p-4 sm:p-6 md:grid-cols-[220px_1fr]">
            <div className="mx-auto w-full max-w-[220px] md:mx-0">
              {story.coverUrl ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-200">
                  <Image src={story.coverUrl} alt={story.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-slate-200 text-sm font-medium text-slate-500">
                  3:4 Thumbnail
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{story.title}</h1>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {story.completionStatus === "completed" ? "FULL" : "ĐANG RA"}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {chapters.length} chương
                </span>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
                <p>Tác giả: {story.author ?? "Đang cập nhật"}</p>
                <p>Trạng thái: {story.completionStatus ?? "ongoing"}</p>
                <p>Tổng chương: {story.totalChaptersPlanned ?? chapters.length}</p>
                <p>Danh mục: {story.category ?? "Đang cập nhật"}</p>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">{story.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    #{tag.name}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={chapters[0] ? `/stories/${story.slug}/${chapters[0].slug}` : "#"}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Đọc từ đầu
                </Link>
                <Link
                  href={
                    chapters[chapters.length - 1]
                      ? `/stories/${story.slug}/${chapters[chapters.length - 1].slug}`
                      : "#"
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Đọc mới nhất
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Danh sách chương</h2>
            <span className="text-sm text-slate-500">{chapters.length} chương</span>
          </div>
          <ul className="space-y-2 sm:space-y-3">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={`/stories/${story.slug}/${chapter.slug}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-700 transition hover:bg-slate-100 sm:px-4"
                >
                  <span>
                    Chương {chapter.chapterNumber}: {chapter.title}
                  </span>
                  <span className="text-xs text-slate-400">Đọc</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
