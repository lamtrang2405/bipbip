import Link from "next/link";
import { redirect } from "next/navigation";
import { updateStoryAction } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { StoryMetaFields } from "@/components/story-meta-fields";
import { getStoryByIdForAdmin } from "@/lib/repository";
import { isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";
import { listTaxonomy, MIGRATION_HINT } from "@/lib/taxonomy";

type Props = {
  params: Promise<{ storyId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const ERRORS: Record<string, string> = {
  invalid: "Vui lòng điền đầy đủ tiêu đề, slug và tóm tắt.",
  slug: "Slug đã được dùng bởi truyện khác.",
  cover: "Không lưu được thumbnail (chỉ nhận JPG/PNG/WEBP tối đa 5MB, link phải là ảnh công khai).",
};

export default async function AdminEditStoryPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { storyId } = await params;
  const q = await searchParams;
  const [story, tagList, categoryList] = await Promise.all([
    getStoryByIdForAdmin(storyId),
    listTaxonomy("tags"),
    listTaxonomy("categories"),
  ]);
  if (!story) redirect("/admin?tab=stories");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/admin?tab=stories" className="text-amber-700 hover:underline dark:text-amber-400">
          ← Quản lý truyện
        </Link>
        <Link href={`/admin/stories/${story.id}`} className="text-amber-700 hover:underline dark:text-amber-400">
          Quản lý chương ({story.chapters.length})
        </Link>
        <Link
          href={`/stories/${story.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-slate-500 hover:underline"
        >
          Xem trên web
        </Link>
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Sửa truyện · {story.title}</h1>

      {!isSupabaseCmsEnabled() ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          Sửa truyện cần cấu hình Supabase (xem README).
        </p>
      ) : null}
      {!categoryList.schemaReady && isSupabaseCmsEnabled() ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {MIGRATION_HINT}
        </p>
      ) : null}
      {q.saved === "1" ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Đã lưu thay đổi.
        </p>
      ) : null}
      {q.error && ERRORS[q.error] ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {ERRORS[q.error]}
        </p>
      ) : null}

      <form
        action={updateStoryAction}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-600 dark:bg-slate-900"
      >
        <input type="hidden" name="storyId" value={story.id} />
        <StoryMetaFields
          story={story}
          tags={tagList.items}
          categories={categoryList.items}
          categoriesReady={categoryList.schemaReady}
        />
        <button type="submit" className="mt-6 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white">
          Lưu thay đổi
        </button>
      </form>
    </main>
  );
}
