import Link from "next/link";
import { deleteStoryAction, toggleStoryFlagAction } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StoryWithChapters } from "@/types/story";

const btn = "rounded border px-2 py-1 text-xs";

export function StoryFlagToggles({ story, returnTo }: { story: StoryWithChapters; returnTo: string }) {
  const published = story.status === "published";
  return (
    <div className="flex flex-wrap gap-1">
      <form action={toggleStoryFlagAction}>
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="flag" value="published" />
        <input type="hidden" name="value" value={published ? "0" : "1"} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          title={published ? "Bấm để chuyển về nháp" : "Bấm để xuất bản"}
          className={`${btn} ${
            published
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {published ? "Đã xuất bản" : "Nháp"}
        </button>
      </form>
      <form action={toggleStoryFlagAction}>
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="flag" value="featured" />
        <input type="hidden" name="value" value={story.isFeatured ? "0" : "1"} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          title={story.isFeatured ? "Bỏ đề cử" : "Đề cử lên trang chủ"}
          className={`${btn} ${
            story.isFeatured
              ? "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
          }`}
        >
          {story.isFeatured ? "★ Đề cử" : "☆ Đề cử"}
        </button>
      </form>
    </div>
  );
}

export function StoryRowActions({ story, returnTo }: { story: StoryWithChapters; returnTo: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Link
        href={`/admin/stories/${story.id}/edit`}
        className={`${btn} border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200`}
      >
        Sửa
      </Link>
      <Link href={`/admin/stories/${story.id}`} className={`${btn} border-slate-300 dark:border-slate-600`}>
        Chương
      </Link>
      <Link
        href={`/stories/${story.slug}`}
        target="_blank"
        rel="noreferrer"
        className={`${btn} border-slate-300 dark:border-slate-600`}
      >
        Xem
      </Link>
      <form action={deleteStoryAction} className="inline">
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <ConfirmSubmitButton
          message={`Xóa truyện "${story.title}" và toàn bộ ${story.chapters.length} chương? Không thể hoàn tác.`}
          className={`${btn} border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200`}
        >
          Xóa
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
