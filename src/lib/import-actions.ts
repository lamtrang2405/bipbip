"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { fetchGoogleSheetXlsx, GoogleSheetError } from "@/lib/import/google-sheet";
import {
  applyImportPlan,
  buildImportPlan,
  toPreview,
  type ImportPreview,
  type ImportResult,
} from "@/lib/import/import-runner";
import { parseWorkbook, WorkbookFormatError } from "@/lib/import/parse-workbook";
import { isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";

export type ImportActionState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "preview"; preview: ImportPreview }
  | { kind: "applied"; preview: ImportPreview; result: ImportResult };

const MAX_EXCEL_BYTES = 20 * 1024 * 1024;

async function loadSource(formData: FormData) {
  const source = formData.get("source") === "excel" ? "excel" : "google_sheet";
  if (source === "excel") {
    const file = formData.get("excelFile");
    if (!(file instanceof File) || file.size === 0) throw new WorkbookFormatError("Chưa chọn file Excel.");
    if (file.size > MAX_EXCEL_BYTES) throw new WorkbookFormatError("File quá lớn (tối đa 20MB).");
    return { source, sourceUrl: file.name, data: await file.arrayBuffer() } as const;
  }
  const url = String(formData.get("sheetUrl") ?? "").trim();
  return { source, sourceUrl: url, data: await fetchGoogleSheetXlsx(url) } as const;
}

/** `intent=preview` chỉ kiểm tra; `intent=apply` tải lại nguồn, kiểm tra lại rồi ghi. */
export async function importAction(_prev: ImportActionState, formData: FormData): Promise<ImportActionState> {
  await requireAdmin();
  if (!isSupabaseCmsEnabled()) return { kind: "error", message: "Import cần cấu hình Supabase (xem README)." };

  try {
    const { source, sourceUrl, data } = await loadSource(formData);
    const plan = await buildImportPlan(parseWorkbook(data));
    const preview = toPreview(plan);

    if (formData.get("intent") !== "apply") return { kind: "preview", preview };
    if (!plan.stories.length) {
      return { kind: "error", message: "Không có dòng hợp lệ nào để import." };
    }

    const result = await applyImportPlan(plan, { source, sourceUrl });
    revalidatePath("/", "layout");
    return { kind: "applied", preview, result };
  } catch (error) {
    if (error instanceof GoogleSheetError || error instanceof WorkbookFormatError) {
      return { kind: "error", message: error.message };
    }
    console.error("[import]", error);
    return { kind: "error", message: `Lỗi không mong muốn: ${error instanceof Error ? error.message : String(error)}` };
  }
}
