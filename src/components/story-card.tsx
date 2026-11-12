import Image from "next/image";
import Link from "next/link";
import { isRecentlyUpdated, relativeTime } from "@/lib/story-format";
import { StoryWithChapters } from "@/types/story";

type StoryCardProps = {
  story: StoryWithChapters;
};

const PLACEHOLDER_GRADIENTS = [
  "from-amber-200 to-rose-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-fuchsia-200 to-purple-300",
  "from-orange-200 to-amber-300",
  "from-lime-200 to-emerald-300",
];

function pickGradient(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
}

export function CoverPlaceholder({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div
      className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${pickGradient(title)} p-3 text-center ${className}`}
    >
      <span className="text-3xl font-bold text-white/90 drop-shadow-sm sm:text-4xl">{title.trim().charAt(0).toUpperCase()}</span>
      <span className="line-clamp-3 text-xs font-semibold leading-4 text-slate-800/80 sm:text-sm sm:leading-5">{title}</span>
    </div>
  );
}

export function StoryCard({ story }: StoryCardProps) {
  const published = story.chapters.filter((chapter) => chapter.isPublished);
  const latestChapter = published.reduce((max, chapter) => Math.max(max, chapter.chapterNumber), 0);
  const isCompleted = story.completionStatus === "completed";
  const isNew = isRecentlyUpdated(story.updatedAt);
  const subtitle = story.author ?? story.category ?? null;
  const firstTag = story.tags.find((tag) => tag.name.trim().toLowerCase() !== subtitle?.trim().toLowerCase())?.name;

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
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <CoverPlaceholder title={story.title} />
          )}

          {isNew ? (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[11px]">
              MỚI
            </div>
          ) : null}
          {isCompleted ? (
            <div className="absolute right-1.5 top-1.5 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[11px]">
              FULL
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 to-transparent px-2 py-1 text-[11px] text-white sm:px-3 sm:py-2 sm:text-xs">
            <span>{latestChapter ? `Ch.${latestChapter}` : "Sắp ra"}</span>
            <span>{relativeTime(story.updatedAt)}</span>
          </div>
        </div>
      </Link>
      <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:min-h-12 sm:text-base sm:leading-6">
          <Link href={`/stories/${story.slug}`} className="hover:text-amber-700">
            {story.title}
          </Link>
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 sm:text-sm">{subtitle ?? "\u00a0"}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{published.length} chương</span>
          {firstTag ? (
            <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{firstTag}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
