import { AdminNav } from "@/components/admin-nav";
import { ImportForm } from "@/components/import-form";
import { requireAdmin } from "@/lib/auth";
import { listImportJobs } from "@/lib/import/import-runner";
import { CHAPTER_COLUMNS, IMPORT_GUIDE_STEPS, STORY_COLUMNS } from "@/lib/import/sheet-template";
import { isTaxonomySchemaReady } from "@/lib/taxonomy";

/** Server Action import chạy trong trang này; import vài trăm chương cần nhiều thời gian hơn mặc định. */
export const maxDuration = 300;

const STATUS_LABELS = { success: "Thành công", partial: "Một phần", failed: "Thất bại" } as const;

export default async function AdminImportPage() {
  await requireAdmin();
  const [jobs, schemaReady] = await Promise.all([listImportJobs(), isTaxonomySchemaReady()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav current="import" schemaReady={schemaReady} />
      <div className="space-y-8 rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Đẩy truyện hàng loạt</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {IMPORT_GUIDE_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/admin/template/google-sheet"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              >
                Tải template trống
              </a>
              <a
                href="/admin/template/google-sheet?data=1"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Tải dữ liệu truyện hiện có (để sửa hàng loạt)
              </a>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Cột trong template</p>
            <p className="mt-2 font-medium">Tab Truyen</p>
            <p>{STORY_COLUMNS.map((c) => (c.required ? `${c.key}*` : c.key)).join(", ")}</p>
            <p className="mt-2 font-medium">Tab Chuong</p>
            <p>{CHAPTER_COLUMNS.map((c) => (c.required ? `${c.key}*` : c.key)).join(", ")}</p>
            <p className="mt-2">
              * bắt buộc. Khi cập nhật truyện đã có, ô để trống = giữ nguyên giá trị cũ. Chi tiết từng cột ở tab
              HuongDan trong template.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-600">
          <ImportForm />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lịch sử import</h2>
          {jobs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Chưa có lần import nào.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2">Thời gian</th>
                    <th className="px-3 py-2">Nguồn</th>
                    <th className="px-3 py-2">Kết quả</th>
                    <th className="px-3 py-2">Truyện tạo / cập nhật</th>
                    <th className="px-3 py-2">Chương</th>
                    <th className="px-3 py-2">Dòng lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="max-w-64 truncate px-3 py-2" title={job.sourceUrl ?? ""}>
                        {job.source === "google_sheet" ? "Google Sheet" : "Excel"}
                        {job.sourceUrl ? <span className="block truncate text-xs text-slate-500">{job.sourceUrl}</span> : null}
                      </td>
                      <td className="px-3 py-2">
                        {STATUS_LABELS[job.status]}
                        {job.summary.failures?.length ? (
                          <span className="block text-xs text-red-600">{job.summary.failures.length} truyện lỗi</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        {job.summary.storiesCreated ?? 0} / {job.summary.storiesUpdated ?? 0}
                      </td>
                      <td className="px-3 py-2">{job.summary.chaptersWritten ?? 0}</td>
                      <td className="px-3 py-2">{job.summary.skippedRows ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
