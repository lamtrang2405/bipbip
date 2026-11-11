import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addChapterToStoryAction,
  deleteChapterAction,
} from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/auth";
import { getStoryByIdForAdmin } from "@/lib/repository";

type Props = {
  params: Promise<{ storyId: string }>;
  searchParams: Promise<{ created?: string; deleted?: string; error?: string }>;
};

export default async function AdminStoryChaptersPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { storyId } = await params;
  const q = await searchParams;
  const story = await getStoryByIdForAdmin(storyId);
  if (!story) redirect("/admin?tab=stories");

  const chapters = [...story.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin?tab=stories"
            className="text-sm text-amber-700 hover:underline dark:text-amber-400"
          >
            ← Quản lý truyện
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            Quản lý chương: {story.title}
          </h1>
          <p className="text-sm text-slate-500">
            /{story.slug} · {chapters.length} chương
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/stories/${story.id}/edit`}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
          >
            Sửa thông tin truyện
          </Link>
          <Link
            href={`/stories/${story.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            Xem trên web
          </Link>
        </div>
      </div>

      {q.created === "chapter" ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Đã thêm chương mới.
        </p>
      ) : null}
      {q.deleted === "chapter" ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Đã xóa chương.
        </p>
      ) : null}
      {q.error === "chapter" ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          Thêm chương thất bại — kiểm tra tiêu đề và nội dung.
        </p>
      ) : null}
      {q.error === "delete" ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          Không xóa được chương.
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-600">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Danh sách chương</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {chapters.length === 0 ? (
            <li className="px-4 py-6 text-center text-slate-500">Chưa có chương nào.</li>
          ) : (
            chapters.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-xs text-slate-500">Ch.{ch.chapterNumber}</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{ch.title}</p>
                  <p className="text-xs text-slate-500">
                    {ch.isPublished ? "Đã đăng" : "Nháp"} · /{ch.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/stories/${story.id}/chapters/${ch.id}`}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                  >
                    Sửa
                  </Link>
                  <form action={deleteChapterAction}>
                    <input type="hidden" name="storyId" value={story.id} />
                    <input type="hidden" name="chapterId" value={ch.id} />
                    <ConfirmSubmitButton
                      message={`Xóa chương ${ch.chapterNumber}: "${ch.title}"?`}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                    >
                      Xóa
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-600 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Thêm chương mới</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Số chương sẽ tự gán là chương tiếp theo ({chapters.length ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1}
          ).
        </p>
        <form action={addChapterToStoryAction} className="mt-4 space-y-3">
          <input type="hidden" name="storyId" value={story.id} />
          <input
            name="title"
            placeholder="Tiêu đề chương"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <textarea
            name="content"
            placeholder="Nội dung chương"
            required
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" name="isPublished" defaultChecked />
            Đăng chương (hiển thị trên web)
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
          >
            Thêm chương
          </button>
        </form>
      </section>
    </main>
  );
}
