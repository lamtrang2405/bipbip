import { slugify } from "@/lib/slugify";
import { CompletionStatus } from "@/types/story";

export const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  ongoing: "Đang ra",
  completed: "Hoàn thành",
  hiatus: "Tạm ngưng",
};

export function completionLabel(status: CompletionStatus | undefined) {
  return COMPLETION_LABELS[status ?? "ongoing"];
}

/** "Chương 3" + "Chương 3" -> "Chương 3"; "Chương 3" + "Gặp lại" -> "Chương 3: Gặp lại". */
export function chapterLabel(chapterNumber: number, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return `Chương ${chapterNumber}`;
  const normalized = slugify(trimmed);
  if (normalized === `chuong-${chapterNumber}` || normalized.startsWith(`chuong-${chapterNumber}-`)) return trimmed;
  return `Chương ${chapterNumber}: ${trimmed}`;
}

export function splitParagraphs(content: string) {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const UNITS: [number, string][] = [
  [60, "giây"],
  [60, "phút"],
  [24, "giờ"],
  [30, "ngày"],
  [12, "tháng"],
  [Number.POSITIVE_INFINITY, "năm"],
];

export function relativeTime(iso: string, now = Date.now()) {
  let value = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (value < 60) return "Vừa xong";
  for (const [size, unit] of UNITS) {
    if (value < size) return `${Math.floor(value)} ${unit} trước`;
    value /= size;
  }
  return "";
}

export function isRecentlyUpdated(iso: string, days = 3, now = Date.now()) {
  return now - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;
}

export function excerpt(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
