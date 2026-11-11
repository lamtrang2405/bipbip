import { AdminNav } from "@/components/admin-nav";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/auth";
import { listTaxonomy, TAXONOMY_LABELS, type TaxonomyKind, type TaxonomyList } from "@/lib/taxonomy";
import { createTaxonomyAction, deleteTaxonomyAction, updateTaxonomyAction } from "@/lib/taxonomy-actions";

type Props = {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string; kind?: string }>;
};

const ERRORS: Record<string, string> = {
  invalid: "Tên hoặc slug không hợp lệ.",
  slug_taken: "Slug đã tồn tại.",
  delete: "Không xóa được (không tìm thấy).",
};

const input =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

const DESCRIPTIONS: Record<TaxonomyKind, string> = {
  tags: "Thể loại hiển thị trong menu \"Thể Loại\" trên header (chỉ những mục đang bật Hiện). Một truyện có nhiều thể loại.",
  categories: "Mỗi truyện thuộc tối đa một danh mục. Đổi tên danh mục sẽ cập nhật cho mọi truyện thuộc danh mục đó.",
};

function TaxonomySection({ kind, list }: { kind: TaxonomyKind; list: TaxonomyList }) {
  const label = TAXONOMY_LABELS[kind];
  return (
    <section id={kind} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
          {label} ({list.items.length})
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{DESCRIPTIONS[kind]}</p>
      </div>

      <form action={createTaxonomyAction} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
        <input type="hidden" name="kind" value={kind} />
        <input name="name" required placeholder={`Tên ${label.toLowerCase()} mới`} className={`${input} min-w-48 flex-1`} />
        <input name="slug" placeholder="Slug (tự tạo nếu trống)" className={`${input} w-48`} />
        <input name="sortOrder" type="number" defaultValue={0} title="Thứ tự" className={`${input} w-20`} />
        <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" name="isVisible" defaultChecked /> Hiện
        </label>
        <button
          type="submit"
          disabled={!list.schemaReady}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {list.items.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có {label.toLowerCase()} nào.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-600">
          <li className="hidden gap-2 px-3 py-2 text-xs font-semibold uppercase text-slate-500 sm:flex">
            <span className="min-w-48 flex-1">Tên</span>
            <span className="w-48">Slug</span>
            <span className="w-20">Thứ tự</span>
            <span className="w-16">Hiện</span>
            <span className="w-16">Truyện</span>
          </li>
          {list.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <form action={updateTaxonomyAction} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={item.id} />
                <input name="name" required defaultValue={item.name} className={`${input} min-w-48 flex-1`} />
                <input name="slug" defaultValue={item.slug} className={`${input} w-48`} />
                <input name="sortOrder" type="number" defaultValue={item.sortOrder} className={`${input} w-20`} />
                <label className="flex w-16 items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" name="isVisible" defaultChecked={item.isVisible} />
                  <span className="sm:hidden">Hiện</span>
                </label>
                <span className="w-16 text-sm text-slate-600 dark:text-slate-300">{item.storyCount}</span>
                <button
                  type="submit"
                  disabled={!list.schemaReady}
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                >
                  Lưu
                </button>
              </form>
              <form action={deleteTaxonomyAction}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={item.id} />
                <ConfirmSubmitButton
                  message={
                    item.storyCount
                      ? `Xóa "${item.name}"? ${item.storyCount} truyện đang dùng ${label.toLowerCase()} này sẽ bị gỡ ${label.toLowerCase()}.`
                      : `Xóa "${item.name}"?`
                  }
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                >
                  Xóa
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminTaxonomyPage({ searchParams }: Props) {
  await requireAdmin();
  const q = await searchParams;
  const [tags, categories] = await Promise.all([listTaxonomy("tags"), listTaxonomy("categories")]);
  const errorKind = q.kind === "categories" ? "categories" : "tags";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav current="taxonomy" schemaReady={tags.schemaReady && categories.schemaReady} />
      <div className="space-y-10 rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900">
        {q.saved || q.deleted ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {q.deleted ? "Đã xóa." : "Đã lưu."}
          </p>
        ) : null}
        {q.error && ERRORS[q.error] ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {TAXONOMY_LABELS[errorKind]}: {ERRORS[q.error]}
          </p>
        ) : null}
        <TaxonomySection kind="tags" list={tags} />
        <TaxonomySection kind="categories" list={categories} />
      </div>
    </main>
  );
}
