import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CoverPlaceholder } from "@/components/story-card";
import { getStoryBySlug } from "@/lib/repository";
import { chapterLabel, completionLabel, excerpt, relativeTime, splitParagraphs } from "@/lib/story-format";
import { StoryTracker } from "@/components/scripts/trackers";
import { AffiliateSlot } from "@/components/affiliate/affiliate-slot";
import { getAffiliateForStory } from "@/lib/affiliate";

type StoryDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: StoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Không tìm thấy truyện" };
  const description = excerpt(story.summary);
  return {
    title: story.author ? `${story.title} - ${story.author}` : story.title,
    description,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "book",
      title: story.title,
      description,
      images: story.coverUrl ? [story.coverUrl] : undefined,
    },
  };
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const chapters = story.chapters
    .filter((chapter) => chapter.isPublished)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
  const affiliate = await getAffiliateForStory(story.id);

  return (
    <div className="min-h-screen">
      <StoryTracker storySlug={story.slug} title={story.title} />
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
                <CoverPlaceholder title={story.title} className="rounded-xl" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{story.title}</h1>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {completionLabel(story.completionStatus)}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {chapters.length} chương
                </span>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
                <p>Tác giả: {story.author ?? "Đang cập nhật"}</p>
                <p>Trạng thái: {completionLabel(story.completionStatus)}</p>
                <p>
                  Số chương: {chapters.length}
                  {story.totalChaptersPlanned && story.totalChaptersPlanned > chapters.length
                    ? ` / ${story.totalChaptersPlanned}`
                    : ""}
                </p>
                <p>
                  Danh mục:{" "}
                  {story.category ? (
                    <Link
                      href={`/stories?danh-muc=${encodeURIComponent(story.category)}`}
                      className="text-amber-700 hover:underline"
                    >
                      {story.category}
                    </Link>
                  ) : (
                    "Đang cập nhật"
                  )}
                </p>
                <p className="sm:col-span-2">Cập nhật: {relativeTime(story.updatedAt)}</p>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
                {splitParagraphs(story.summary).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/stories?the-loai=${encodeURIComponent(tag.name)}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>

              {chapters.length ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/stories/${story.slug}/${chapters[0].slug}`}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Đọc từ đầu
                  </Link>
                  {chapters.length > 1 ? (
                    <Link
                      href={`/stories/${story.slug}/${chapters[chapters.length - 1].slug}`}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Đọc chương mới nhất
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">Truyện chưa có chương nào được đăng.</p>
              )}
            </div>
          </div>
        </section>

        {affiliate.story_detail ? (
          <AffiliateSlot
            placement="story_detail"
            offers={affiliate.story_detail.offers}
            storyId={story.id}
            className="mx-auto mt-6 max-w-3xl"
          />
        ) : null}

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
                  <span>{chapterLabel(chapter.chapterNumber, chapter.title)}</span>
                  <span className="text-xs text-slate-400">Đọc</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
