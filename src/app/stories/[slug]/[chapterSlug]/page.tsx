import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getChapterBySlug } from "@/lib/repository";

type ChapterPageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = await params;
  const data = await getChapterBySlug(slug, chapterSlug);
  if (!data) notFound();

  const { story, chapter, prev, next } = data;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="text-sm text-slate-500">
          <Link href={`/stories/${story.slug}`}>{story.title}</Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Chương {chapter.chapterNumber}: {chapter.title}
        </h1>
        <article className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-8 leading-8 text-slate-700 shadow-sm">
          {chapter.content}
        </article>

        <div className="mt-8 flex items-center justify-between gap-3">
          {prev ? (
            <Link
              href={`/stories/${story.slug}/${prev.slug}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
            >
              Chương trước
            </Link>
          ) : (
            <span className="text-sm text-slate-500">Chương trước</span>
          )}

          {next ? (
            <Link
              href={`/stories/${story.slug}/${next.slug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white"
            >
              Chương tiếp
            </Link>
          ) : (
            <span className="text-sm text-slate-500">Hết chương</span>
          )}
        </div>
      </main>
    </div>
  );
}
