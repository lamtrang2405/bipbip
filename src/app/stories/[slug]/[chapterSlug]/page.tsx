import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getChapterBySlug } from "@/lib/repository";
import { chapterLabel, excerpt, splitParagraphs } from "@/lib/story-format";
import { ChapterTracker } from "@/components/scripts/trackers";
import { AdSenseUnit } from "@/components/adsense-unit";
import { NextChapterLink } from "@/components/scripts/next-chapter-link";
import { Chapter } from "@/types/story";

type ChapterPageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const data = await getChapterBySlug(slug, chapterSlug);
  if (!data) return { title: "Không tìm thấy chương" };
  const { story, chapter } = data;
  const label = chapterLabel(chapter.chapterNumber, chapter.title);
  return {
    title: `${label} - ${story.title}`,
    description: excerpt(chapter.content),
    alternates: { canonical: `/stories/${story.slug}/${chapter.slug}` },
    openGraph: {
      type: "article",
      title: `${label} - ${story.title}`,
      description: excerpt(chapter.content),
      images: story.coverUrl ? [story.coverUrl] : undefined,
    },
  };
}

function ChapterNav({
  storySlug,
  current,
  prev,
  next,
}: {
  storySlug: string;
  current: Chapter;
  prev: Chapter | null;
  next: Chapter | null;
}) {
  const base = "rounded-lg px-4 py-2 text-sm font-medium";
  return (
    <nav className="flex items-center justify-between gap-2">
      {prev ? (
        <Link href={`/stories/${storySlug}/${prev.slug}`} className={`${base} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          ← Chương trước
        </Link>
      ) : (
        <span className={`${base} border border-slate-200 text-slate-400`}>← Chương trước</span>
      )}
      <Link href={`/stories/${storySlug}`} className={`${base} text-slate-600 hover:text-amber-700`}>
        Mục lục
      </Link>
      {next ? (
        <NextChapterLink
          storySlug={storySlug}
          fromChapterSlug={current.slug}
          href={`/stories/${storySlug}/${next.slug}`}
          className={`${base} bg-amber-500 text-white hover:bg-amber-600`}
        >
          Chương tiếp →
        </NextChapterLink>
      ) : (
        <span className={`${base} border border-slate-200 text-slate-400`}>Hết chương</span>
      )}
    </nav>
  );
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = await params;
  const data = await getChapterBySlug(slug, chapterSlug);
  if (!data) notFound();

  const { story, chapter, prev, next } = data;
  const paragraphs = splitParagraphs(chapter.content);

  return (
    <div className="min-h-screen">
      <ChapterTracker storySlug={story.slug} chapterSlug={chapter.slug} chapterNumber={chapter.chapterNumber} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <p className="text-sm text-slate-500">
          <Link href={`/stories/${story.slug}`} className="hover:text-amber-700 hover:underline">
            {story.title}
          </Link>
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
          {chapterLabel(chapter.chapterNumber, chapter.title)}
        </h1>

        <div className="mt-5">
          <ChapterNav storySlug={story.slug} current={chapter} prev={prev} next={next} />
        </div>

        <div className="my-6">
          <AdSenseUnit adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CHAPTER_TOP} />
        </div>

        <article className="space-y-5 rounded-xl border border-slate-200 bg-white px-5 py-7 text-[17px] leading-8 text-slate-800 shadow-sm sm:px-8 sm:text-lg">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>

        <div className="my-6">
          <AdSenseUnit adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CHAPTER_BOTTOM} />
        </div>

        <ChapterNav storySlug={story.slug} current={chapter} prev={prev} next={next} />
      </main>
      <SiteFooter />
    </div>
  );
}
