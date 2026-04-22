import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteChapterAction, updateChapterAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { getStoryByIdForAdmin } from "@/lib/repository";

type Props = {
  params: Promise<{ storyId: string; chapterId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminEditChapterPage({ params, searchParams }: Props) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { storyId, chapterId } = await params;
  const q = await searchParams;

  const story = await getStoryByIdForAdmin(storyId);
  if (!story) redirect("/admin?tab=stories");

  const chapter = story.chapters.find((c) => c.id === chapterId);
  if (!chapter) redirect(`/admin/stories/${storyId}`);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href={`/admin/stories/${storyId}`}
        className="text-sm text-amber-700 hover:underline dark:text-amber-400"
      >
        ← Danh sách chương
      </Link>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Sửa chương · {story.title}
      </h1>

      {q.saved === "1" ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Đã lưu thay đổi.
        </p>
      ) : null}
      {q.error === "1" ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          Lưu thất bại — kiểm tra dữ liệu.
        </p>
      ) : null}

      <form action={updateChapterAction} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-600 dark:bg-slate-900">
        <input type="hidden" name="storyId" value={storyId} />
        <input type="hidden" name="chapterId" value={chapterId} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Số chương
          </label>
          <input
            type="number"
            name="chapterNumber"
            min={1}
            required
            defaultValue={chapter.chapterNumber}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tiêu đề
          </label>
          <input
            name="title"
            required
            defaultValue={chapter.title}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nội dung
          </label>
          <textarea
            name="content"
            required
            rows={16}
            defaultValue={chapter.content}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" name="isPublished" defaultChecked={chapter.isPublished} />
          Đăng chương (hiển thị trên web)
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
          >
            Lưu
          </button>
        </div>
      </form>

      <form action={deleteChapterAction} className="mt-6">
        <input type="hidden" name="storyId" value={storyId} />
        <input type="hidden" name="chapterId" value={chapterId} />
        <button
          type="submit"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          Xóa chương này
        </button>
      </form>
    </main>
  );
}
