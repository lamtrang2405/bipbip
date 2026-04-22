import Image from "next/image";
import Link from "next/link";
import { StoryWithChapters } from "@/types/story";

type StoryCardProps = {
  story: StoryWithChapters;
};

export function StoryCard({ story }: StoryCardProps) {
  const latestChapter = story.chapters.reduce(
    (max, chapter) => (chapter.chapterNumber > max ? chapter.chapterNumber : max),
    0,
  );
  const isFull = story.chapters.length >= 2;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl">
      <Link href={`/stories/${story.slug}`} className="block">
        <div className="relative">
          {story.coverUrl ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
              <Image
                src={story.coverUrl}
                alt={story.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-200 text-sm font-medium text-slate-500">
              3:4 Thumbnail
            </div>
          )}

          <div className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[11px]">
            MỚI
          </div>
          {isFull ? (
            <div className="absolute right-1.5 top-1.5 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[11px]">
              FULL
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 to-transparent px-2 py-1 text-[11px] text-white sm:px-3 sm:py-2 sm:text-xs">
            <span>Ch.{latestChapter || 1}</span>
            <span>1 giờ</span>
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-2.5 sm:space-y-3 sm:p-3">
        <h3 className="line-clamp-2 min-h-10 text-base font-semibold leading-5 text-slate-900 sm:min-h-12 sm:text-xl sm:leading-6">
          <Link href={`/stories/${story.slug}`}>{story.title}</Link>
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 sm:text-sm">
          {story.author ?? "Đang cập nhật tác giả"}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 sm:gap-3 sm:text-sm">
          <span>{story.tags.length}</span>
          <span>{story.totalChaptersPlanned ?? (latestChapter || 1)} chương</span>
          <span>{story.category ?? "Chưa có danh mục"}</span>
        </div>
      </div>
    </article>
  );
}
