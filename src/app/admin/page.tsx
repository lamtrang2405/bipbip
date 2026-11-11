import Link from "next/link";
import { createStoryAction } from "@/lib/admin-actions";
import { AdminNav } from "@/components/admin-nav";
import { AdminStoryForm } from "@/components/admin-story-form";
import { StoryFlagToggles, StoryRowActions } from "@/components/admin-story-actions";
import { requireAdmin } from "@/lib/auth";
import { groupStoriesByCategoryLabel, listAdminStories } from "@/lib/repository";
import { listTaxonomy } from "@/lib/taxonomy";

const TABS = ["create", "category", "stories"] as const;
type AdminTab = (typeof TABS)[number];

function parseTab(raw: string | undefined): AdminTab {
  if (raw && TABS.includes(raw as AdminTab)) return raw as AdminTab;
  return "create";
}

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    tab?: string;
    deleted?: string;
    q?: string;
    category?: string;
    tag?: string;
    status?: string;
    featured?: string;
  }>;
};

const filterInput =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const tab = parseTab(params.tab);
  const showDeleted = params.deleted === "1";
  const showDeleteError = params.error === "delete";

  const [stories, tagList, categoryList] = await Promise.all([
    listAdminStories(),
    listTaxonomy("tags"),
    listTaxonomy("categories"),
  ]);
  const schemaReady = tagList.schemaReady && categoryList.schemaReady;
  const byCategory = groupStoriesByCategoryLabel(stories);

  const q = (params.q ?? "").trim().toLowerCase();
  const filtered = stories
    .filter((s) => !q || `${s.title} ${s.slug} ${s.author ?? ""}`.toLowerCase().includes(q))
    .filter((s) => !params.category || (s.category ?? "") === params.category)
    .filter((s) => !params.tag || s.tags.some((t) => t.id === params.tag))
    .filter((s) => !params.status || s.status === params.status)
    .filter((s) => params.featured !== "1" || s.isFeatured)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const currentQuery = new URLSearchParams(
    Object.entries({ ...params, tab, deleted: undefined, error: undefined }).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
    ),
  ).toString();
  const returnTo = `/admin?${currentQuery}`;

  const deleteNotices = (
    <>
      {showDeleteError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Không xóa được truyện (không tìm thấy hoặc lỗi dữ liệu).
        </p>
      ) : null}
      {showDeleted ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Đã xóa truyện khỏi kho dữ liệu.
        </p>
      ) : null}
    </>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav current={tab} schemaReady={schemaReady} />

      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900">
        {tab === "create" ? (
          <div className="space-y-6">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              Cần đẩy nhiều truyện cùng lúc? Dùng{" "}
              <Link href="/admin/import" className="font-medium text-amber-700 underline dark:text-amber-400">
                Import Google Sheet / Excel
              </Link>
              .
            </p>
            <AdminStoryForm
              action={createStoryAction}
              storyCreated={params.created === "story"}
              showStoryError={params.error === "story"}
              showSlugError={params.error === "slug"}
              tags={tagList.items}
              categories={categoryList.items}
              categoriesReady={categoryList.schemaReady}
            />
          </div>
        ) : null}

        {tab === "category" ? (
          <div className="space-y-6">
            {deleteNotices}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Dữ liệu nhóm theo trường <strong>Danh mục</strong> trên mỗi truyện. Tổng{" "}
              <strong>{stories.length}</strong> truyện trong kho.
            </p>
            {byCategory.length === 0 ? (
              <p className="text-slate-500">Chưa có truyện nào.</p>
            ) : (
              byCategory.map((group) => (
                <section
                  key={group.categoryLabel}
                  className="rounded-xl border border-slate-200 dark:border-slate-600"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/80">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {group.categoryLabel}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {group.stories.length} truyện
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {group.stories.map((story) => (
                      <li
                        key={story.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{story.title}</p>
                          <p className="text-xs text-slate-500">
                            {story.author ?? "Không rõ tác giả"} · {story.chapters.length} chương · /{story.slug}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StoryFlagToggles story={story} returnTo={returnTo} />
                          <StoryRowActions story={story} returnTo={returnTo} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        ) : null}

        {tab === "stories" ? (
          <div className="space-y-4">
            {deleteNotices}
            <form method="get" action="/admin" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="tab" value="stories" />
              <input name="q" defaultValue={params.q} placeholder="Tìm tiêu đề, slug, tác giả" className={`${filterInput} min-w-56 flex-1`} />
              <select name="category" defaultValue={params.category ?? ""} className={filterInput}>
                <option value="">Mọi danh mục</option>
                {byCategory
                  .filter((group) => group.stories.some((s) => s.category?.trim()))
                  .map((group) => (
                    <option key={group.categoryLabel} value={group.categoryLabel}>
                      {group.categoryLabel} ({group.stories.length})
                    </option>
                  ))}
              </select>
              <select name="tag" defaultValue={params.tag ?? ""} className={filterInput}>
                <option value="">Mọi thể loại</option>
                {tagList.items.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} ({tag.storyCount})
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={params.status ?? ""} className={filterInput}>
                <option value="">Mọi trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Nháp</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" name="featured" value="1" defaultChecked={params.featured === "1"} />
                Chỉ đề cử
              </label>
              <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-amber-600">
                Lọc
              </button>
              <Link href="/admin?tab=stories" className="px-2 py-2 text-sm text-slate-500 hover:underline">
                Xóa lọc
              </Link>
            </form>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filtered.length} / {stories.length} truyện, sắp xếp theo cập nhật mới nhất.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tiêu đề</th>
                    <th className="px-3 py-2 font-semibold">Tác giả</th>
                    <th className="px-3 py-2 font-semibold">Danh mục / Thể loại</th>
                    <th className="px-3 py-2 font-semibold">Hiển thị</th>
                    <th className="px-3 py-2 font-semibold">Chương</th>
                    <th className="px-3 py-2 font-semibold">Cập nhật</th>
                    <th className="px-3 py-2 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((story) => (
                    <tr key={story.id} className="bg-white align-top dark:bg-slate-900">
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {story.title}
                        <div className="text-xs font-normal text-slate-500">/{story.slug}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.author ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.category ?? "—"}
                        <div className="text-xs text-slate-500">
                          {story.tags.map((t) => t.name).join(", ") || "Chưa có thể loại"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <StoryFlagToggles story={story} returnTo={returnTo} />
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.chapters.length}
                        {story.totalChaptersPlanned ? ` / ${story.totalChaptersPlanned}` : ""}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {new Date(story.updatedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2">
                        <StoryRowActions story={story} returnTo={returnTo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
