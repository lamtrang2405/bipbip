import * as XLSX from "xlsx";
import { slugify } from "@/lib/slugify";
import { CHAPTER_COLUMNS, CHAPTER_SHEET, STORY_COLUMNS, STORY_SHEET } from "@/lib/import/sheet-template";

export type CellValue = string | number | boolean | null;
export type SheetRow = { row: number; values: Record<string, CellValue> };

export type ParsedWorkbook = {
  format: "template" | "legacy-two-sheet" | "legacy-flat";
  storyRows: SheetRow[];
  chapterRows: SheetRow[];
};

export class WorkbookFormatError extends Error {}

/** "Mã truyện", "ma_truyen", "chapterTitle" -> khóa so khớp ổn định. */
function headerKey(raw: string) {
  return slugify(raw).replace(/-/g, "_");
}

function buildAliases(columns: { key: string; label: string }[]) {
  const map = new Map<string, string>();
  for (const c of columns) {
    map.set(headerKey(c.key), c.key);
    map.set(headerKey(c.label), c.key);
  }
  return map;
}

function findSheet(workbook: XLSX.WorkBook, name: string) {
  const target = headerKey(name);
  const found = workbook.SheetNames.find((n) => headerKey(n) === target);
  return found ? workbook.Sheets[found] : undefined;
}

function readRows(sheet: XLSX.WorkSheet, aliases: Map<string, string>): SheetRow[] {
  const matrix = XLSX.utils.sheet_to_json<CellValue[]>(sheet, { header: 1, defval: null, blankrows: false, raw: true });
  if (!matrix.length) return [];
  const headers = (matrix[0] ?? []).map((h) => aliases.get(headerKey(String(h ?? ""))) ?? null);
  const rows: SheetRow[] = [];
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

  matrix.slice(1).forEach((cells, index) => {
    const values: Record<string, CellValue> = {};
    let hasValue = false;
    headers.forEach((key, col) => {
      if (!key) return;
      const cell = cells[col];
      const value = typeof cell === "string" ? cell.trim() : (cell ?? null);
      if (value !== null && value !== "") hasValue = true;
      values[key] = value === "" ? null : value;
    });
    const rowNum = (cells as CellValue[] & { __rowNum__?: number }).__rowNum__;
    if (hasValue) rows.push({ row: (rowNum ?? range.s.r + index + 1) + 1, values });
  });
  return rows;
}

const LEGACY_STORY_ALIASES = new Map([
  ["slug", "ma_truyen"],
  ["title", "tieu_de"],
  ["author", "tac_gia"],
  ["summary", "tom_tat"],
  ["description", "tom_tat"],
  ["tags", "the_loai"],
  ["category", "danh_muc"],
  ["completionstatus", "trang_thai"],
  ["totalchaptersplanned", "tong_chuong_du_kien"],
  ["thumbnailurl", "anh_bia_url"],
  ["publishnow", "xuat_ban"],
]);

const LEGACY_CHAPTER_ALIASES = new Map([
  ["chapternumber", "so_chuong"],
  ["title", "tieu_de_chuong"],
  ["content", "noi_dung"],
  ["ispublished", "xuat_ban"],
]);

const LEGACY_FLAT_ALIASES = new Map([
  ...LEGACY_STORY_ALIASES,
  ["chaptertitle", "tieu_de_chuong"],
  ["chaptercontent", "noi_dung"],
]);

/** Định dạng cũ 1 tab: mỗi dòng = 1 chương kèm thông tin truyện, đánh số chương theo thứ tự dòng. */
function splitLegacyFlat(rows: SheetRow[]): Pick<ParsedWorkbook, "storyRows" | "chapterRows"> {
  const storyRows: SheetRow[] = [];
  const chapterRows: SheetRow[] = [];
  const counters = new Map<string, number>();
  for (const { row, values } of rows) {
    const title = String(values.tieu_de ?? "").trim();
    const code = slugify(String(values.ma_truyen ?? "") || title);
    if (!code) continue;
    if (!counters.has(code)) {
      counters.set(code, 0);
      storyRows.push({ row, values: { ...values, ma_truyen: code, xuat_ban: values.xuat_ban ?? true } });
    }
    if (values.tieu_de_chuong || values.noi_dung) {
      const n = (counters.get(code) ?? 0) + 1;
      counters.set(code, n);
      chapterRows.push({
        row,
        values: { ma_truyen: code, so_chuong: n, tieu_de_chuong: values.tieu_de_chuong, noi_dung: values.noi_dung, xuat_ban: true },
      });
    }
  }
  return { storyRows, chapterRows };
}

export function parseWorkbook(data: ArrayBuffer | Buffer): ParsedWorkbook {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: data instanceof ArrayBuffer ? "array" : "buffer" });
  } catch {
    throw new WorkbookFormatError("Không đọc được file. Hãy dùng file .xlsx theo template.");
  }

  const storySheet = findSheet(workbook, STORY_SHEET);
  const chapterSheet = findSheet(workbook, CHAPTER_SHEET);
  if (storySheet || chapterSheet) {
    return {
      format: "template",
      storyRows: storySheet ? readRows(storySheet, buildAliases(STORY_COLUMNS)) : [],
      chapterRows: chapterSheet ? readRows(chapterSheet, buildAliases(CHAPTER_COLUMNS)) : [],
    };
  }

  const legacyStory = findSheet(workbook, "story");
  const legacyChapters = findSheet(workbook, "chapters");
  if (legacyStory && legacyChapters) {
    const storyRows = readRows(legacyStory, LEGACY_STORY_ALIASES).slice(0, 1);
    const code = slugify(String(storyRows[0]?.values.ma_truyen ?? "") || String(storyRows[0]?.values.tieu_de ?? ""));
    if (storyRows[0]) storyRows[0].values.ma_truyen = code;
    const chapterRows = readRows(legacyChapters, LEGACY_CHAPTER_ALIASES).map((r) => ({
      ...r,
      values: { ...r.values, ma_truyen: code },
    }));
    return { format: "legacy-two-sheet", storyRows, chapterRows };
  }

  const first = workbook.SheetNames[0];
  if (!first) throw new WorkbookFormatError("File không có sheet nào.");
  const flat = readRows(workbook.Sheets[first], LEGACY_FLAT_ALIASES);
  if (!flat.length) {
    throw new WorkbookFormatError(`Không tìm thấy tab "${STORY_SHEET}" / "${CHAPTER_SHEET}" theo template.`);
  }
  return { format: "legacy-flat", ...splitLegacyFlat(flat) };
}
