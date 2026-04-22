import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createStoryAction,
  deleteStoryAction,
  importStoryFromExcelAction,
  logoutAction,
} from "@/lib/admin-actions";
import { AdminStoryForm } from "@/components/admin-story-form";
import { isAdminAuthenticated } from "@/lib/auth";
import { groupStoriesByCategoryLabel, listAdminStories } from "@/lib/repository";

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
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const isAuthed = await isAdminAuthenticated();
  if (!isAuthed) redirect("/admin/login");

  const params = await searchParams;
  const tab = parseTab(params.tab);
  const showStoryError = params.error === "story";
  const showExcelError = params.error === "excel";
  const storyCreated = params.created === "story";
  const excelCreated = params.created === "excel";
  const showDeleted = params.deleted === "1";
  const showDeleteError = params.error === "delete";

  const stories = await listAdminStories();
  const byCategory = groupStoriesByCategoryLabel(stories);
  const storiesSorted = [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const tabLink = (id: AdminTab) => `/admin?tab=${id}`;

  const tabBtn = (id: AdminTab, label: string) => (
    <Link
      href={tabLink(id)}
      className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
        tab === id
          ? "border border-b-0 border-slate-200 bg-white text-amber-800 dark:border-slate-600 dark:bg-slate-900 dark:text-amber-200"
          : "border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin CMS</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            Đăng xuất
          </button>
        </form>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabBtn("create", "Đẩy nội dung")}
        {tabBtn("category", "Quản lý theo danh mục")}
        {tabBtn("stories", "Quản lý theo truyện")}
      </nav>

      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900">
        {tab === "create" ? (
          <div className="space-y-8">
            <AdminStoryForm
              action={createStoryAction}
              storyCreated={storyCreated}
              showStoryError={showStoryError}
            />

            <div>
              <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                Import truyện bằng file Excel
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Tải template mẫu và điền theo đúng các trường: tiêu đề, tác giả, tóm tắt, thể loại, trạng thái, tổng
                chương, thumbnail, danh mục và nội dung chương.
              </p>
              <form action={importStoryFromExcelAction} className="mt-4 space-y-3">
                <div>
                  <a
                    href="/admin/template/excel"
                    className="inline-flex rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                  >
                    Tải template Excel mẫu
                  </a>
                </div>
                {excelCreated ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Đã import file Excel thành công.
                  </p>
                ) : null}
                {showExcelError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    File Excel không hợp lệ. Vui lòng dùng template mẫu và điền đầy đủ dữ liệu bắt buộc.
                  </p>
                ) : null}
                <input
                  type="file"
                  name="excelFile"
                  accept=".xlsx,.xls"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
                >
                  Upload và trích xuất dữ liệu
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {tab === "category" ? (
          <div className="space-y-6">
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
                            {story.author ?? "Không rõ tác giả"} · {story.status} ·{" "}
                            {story.chapters.length} chương · /{story.slug}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/stories/${story.id}`}
                            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                          >
                            Chương
                          </Link>
                          <Link
                            href={`/stories/${story.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:text-slate-200"
                          >
                            Xem web
                          </Link>
                          <form action={deleteStoryAction}>
                            <input type="hidden" name="storyId" value={story.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                            >
                              Xóa
                            </button>
                          </form>
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Danh sách tất cả truyện đã đẩy lên, sắp xếp theo cập nhật mới nhất.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tiêu đề</th>
                    <th className="px-3 py-2 font-semibold">Tác giả</th>
                    <th className="px-3 py-2 font-semibold">Danh mục</th>
                    <th className="px-3 py-2 font-semibold">Trạng thái</th>
                    <th className="px-3 py-2 font-semibold">Chương</th>
                    <th className="px-3 py-2 font-semibold">Cập nhật</th>
                    <th className="px-3 py-2 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {storiesSorted.map((story) => (
                    <tr key={story.id} className="bg-white dark:bg-slate-900">
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {story.title}
                        <div className="text-xs font-normal text-slate-500">/{story.slug}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.author ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.category ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{story.status}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {story.chapters.length}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {new Date(story.updatedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Link
                            href={`/admin/stories/${story.id}`}
                            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                          >
                            Chương
                          </Link>
                          <Link
                            href={`/stories/${story.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                          >
                            Xem
                          </Link>
                          <form action={deleteStoryAction} className="inline">
                            <input type="hidden" name="storyId" value={story.id} />
                            <button
                              type="submit"
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                            >
                              Xóa
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {storiesSorted.length === 0 ? (
              <p className="text-center text-slate-500">Chưa có truyện nào.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
