import * as XLSX from "xlsx";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  CHAPTER_COLUMNS,
  CHAPTER_EXAMPLES,
  CHAPTER_SHEET,
  GUIDE_SHEET,
  IMPORT_GUIDE_STEPS,
  STORY_COLUMNS,
  STORY_EXAMPLE,
  STORY_SHEET,
} from "@/lib/import/sheet-template";
import { listAdminStories } from "@/lib/repository";
import { CompletionStatus } from "@/types/story";

const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  ongoing: "Đang ra",
  completed: "Hoàn thành",
  hiatus: "Tạm ngưng",
};

function sheetFromRows(keys: string[], rows: Record<string, unknown>[], widths: number[]) {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: keys });
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  return sheet;
}

/** `?data=1`: xuất toàn bộ truyện hiện có ra tab Truyen để sửa hàng loạt rồi import lại. */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const withData = new URL(request.url).searchParams.get("data") === "1";
  const storyKeys = STORY_COLUMNS.map((c) => c.key);
  const chapterKeys = CHAPTER_COLUMNS.map((c) => c.key);

  const storyRows: Record<string, unknown>[] = withData
    ? (await listAdminStories()).map((story) => ({
        ma_truyen: story.slug,
        tieu_de: story.title,
        tac_gia: story.author ?? "",
        tom_tat: story.summary,
        the_loai: story.tags.map((t) => t.name).join(", "),
        danh_muc: story.category ?? "",
        trang_thai: COMPLETION_LABELS[story.completionStatus ?? "ongoing"],
        tong_chuong_du_kien: story.totalChaptersPlanned ?? "",
        anh_bia_url: story.coverUrl ?? "",
        xuat_ban: story.status === "published",
        de_cu: Boolean(story.isFeatured),
      }))
    : [STORY_EXAMPLE];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromRows(storyKeys, storyRows, [28, 36, 20, 50, 28, 16, 14, 12, 30, 10, 10]),
    STORY_SHEET,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromRows(chapterKeys, withData ? [] : CHAPTER_EXAMPLES, [28, 10, 36, 80, 10]),
    CHAPTER_SHEET,
  );

  const guideRows: (string | number)[][] = [
    ["HƯỚNG DẪN IMPORT"],
    ...IMPORT_GUIDE_STEPS.map((step, i) => [`${i + 1}. ${step}`]),
    [],
    ["Quy tắc: ô để trống khi cập nhật truyện đã có = giữ nguyên giá trị cũ."],
    [],
    ["Tab", "Cột", "Tên hiển thị", "Bắt buộc", "Ghi chú"],
    ...STORY_COLUMNS.map((c) => [STORY_SHEET, c.key, c.label, c.required ? "Có" : "", c.note]),
    ...CHAPTER_COLUMNS.map((c) => [CHAPTER_SHEET, c.key, c.label, c.required ? "Có" : "", c.note]),
  ];
  const guide = XLSX.utils.aoa_to_sheet(guideRows);
  guide["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, guide, GUIDE_SHEET);

  const content = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const fileName = withData ? "bipbip-du-lieu-truyen.xlsx" : "bipbip-import-template.xlsx";

  return new Response(content, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
