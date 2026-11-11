"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { importAction, type ImportActionState } from "@/lib/import-actions";
import type { ImportIssue, ImportPreview } from "@/lib/import/import-runner";

const ACTION_LABELS: Record<ImportPreview["stories"][number]["action"], string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  chapters_only: "Chỉ thêm chương",
};

const FORMAT_LABELS: Record<ImportPreview["format"], string> = {
  template: "Template 2 tab (Truyen, Chuong)",
  "legacy-two-sheet": "Định dạng cũ (story, chapters)",
  "legacy-flat": "Định dạng cũ 1 tab",
};

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const MAX_ROWS_SHOWN = 200;

function IssueList({ title, issues, tone }: { title: string; issues: ImportIssue[]; tone: "red" | "amber" }) {
  if (!issues.length) return null;
  const color =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
  return (
    <details open={tone === "red"} className={`rounded-lg border px-3 py-2 text-sm ${color}`}>
      <summary className="cursor-pointer font-medium">
        {title} ({issues.length})
      </summary>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
        {issues.map((issue, i) => (
          <li key={i}>
            {issue.row ? `[${issue.sheet} dòng ${issue.row}] ` : ""}
            {issue.message}
          </li>
        ))}
      </ul>
    </details>
  );
}

function PreviewView({ preview }: { preview: ImportPreview }) {
  const stats = [
    { label: "Truyện tạo mới", value: preview.stats.storiesCreate },
    { label: "Truyện cập nhật", value: preview.stats.storiesUpdate },
    { label: "Chương thêm mới", value: preview.stats.chaptersInsert },
    { label: "Chương ghi đè", value: preview.stats.chaptersOverwrite },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Định dạng: {FORMAT_LABELS[preview.format]}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <IssueList title="Lỗi – các dòng này sẽ bị bỏ qua" issues={preview.errors} tone="red" />
      <IssueList title="Cảnh báo" issues={preview.warnings} tone="amber" />
      {preview.stories.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <tr>
                <th className="px-3 py-2">Truyện</th>
                <th className="px-3 py-2">Thao tác</th>
                <th className="px-3 py-2">Chương mới / ghi đè</th>
                <th className="px-3 py-2">Danh mục</th>
                <th className="px-3 py-2">Thể loại</th>
                <th className="px-3 py-2">Xuất bản / Đề cử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {preview.stories.slice(0, MAX_ROWS_SHOWN).map((s) => (
                <tr key={s.slug}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{s.title}</p>
                    <p className="text-xs text-slate-500">/{s.slug}</p>
                  </td>
                  <td className="px-3 py-2">{ACTION_LABELS[s.action]}</td>
                  <td className="px-3 py-2">
                    {s.chaptersInsert} / {s.chaptersOverwrite}
                  </td>
                  <td className="px-3 py-2">{s.category ?? <span className="text-slate-400">giữ nguyên</span>}</td>
                  <td className="px-3 py-2">{s.tags ? s.tags.join(", ") : <span className="text-slate-400">giữ nguyên</span>}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.status === null ? "giữ nguyên" : s.status === "published" ? "Xuất bản" : "Nháp"}
                    {" / "}
                    {s.isFeatured === null ? "giữ nguyên" : s.isFeatured ? "Có" : "Không"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.stories.length > MAX_ROWS_SHOWN ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              … và {preview.stories.length - MAX_ROWS_SHOWN} truyện khác.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ImportForm() {
  const [state, dispatch, pending] = useActionState<ImportActionState, FormData>(importAction, { kind: "idle" });
  const [source, setSource] = useState<"google_sheet" | "excel">("google_sheet");
  const [stale, setStale] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (intent: "preview" | "apply") => {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    if (intent === "apply" && !window.confirm("Ghi dữ liệu vào web? Chương trùng số sẽ bị ghi đè.")) return;
    const formData = new FormData(form);
    formData.set("intent", intent);
    setStale(false);
    startTransition(() => dispatch(formData));
  };

  const canApply = state.kind === "preview" && !stale && state.preview.stories.length > 0;

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          submit("preview");
        }}
        onChange={() => setStale(true)}
        className="space-y-4"
      >
        <div className="flex gap-4 text-sm">
          {(
            [
              ["google_sheet", "Link Google Sheet"],
              ["excel", "Upload file Excel"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="source"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
              />
              {label}
            </label>
          ))}
        </div>

        {source === "google_sheet" ? (
          <input
            name="sheetUrl"
            type="url"
            required
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            className={input}
          />
        ) : (
          <input name="excelFile" type="file" required accept=".xlsx,.xls" className={input} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 font-medium text-amber-800 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
          >
            Kiểm tra
          </button>
          <button
            type="button"
            disabled={pending || !canApply}
            onClick={() => submit("apply")}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Xác nhận import
          </button>
          {pending ? (
            <span className="text-sm text-slate-500">Đang xử lý… import nhiều chương có thể mất vài phút.</span>
          ) : null}
          {stale && state.kind === "preview" ? (
            <span className="text-sm text-amber-700">Nguồn đã thay đổi, hãy bấm Kiểm tra lại.</span>
          ) : null}
        </div>
      </form>

      {state.kind === "error" ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {state.message}
        </p>
      ) : null}

      {state.kind === "applied" ? (
        <div
          className={`rounded-lg px-3 py-3 text-sm ${
            state.result.status === "failed"
              ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
              : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          }`}
        >
          <p className="font-semibold">
            {state.result.status === "success"
              ? "Import thành công."
              : state.result.status === "partial"
                ? "Import xong một phần."
                : "Import thất bại."}
          </p>
          <p className="mt-1">
            Tạo {state.result.storiesCreated} truyện, cập nhật {state.result.storiesUpdated} truyện, ghi{" "}
            {state.result.chaptersWritten} chương.
          </p>
          {state.result.failures.length ? (
            <ul className="mt-2 list-disc pl-5">
              {state.result.failures.map((f) => (
                <li key={f.slug}>
                  {f.slug}: {f.message}
                </li>
              ))}
            </ul>
          ) : null}
          {state.result.warnings.length ? (
            <ul className="mt-2 list-disc pl-5 text-amber-800 dark:text-amber-200">
              {state.result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {state.kind === "preview" || state.kind === "applied" ? <PreviewView preview={state.preview} /> : null}
    </div>
  );
}
