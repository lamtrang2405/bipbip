"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import {
  createChapter,
  createStory,
  deleteChapterById,
  deleteStoryById,
  getStoryByIdForAdmin,
  updateChapter,
} from "@/lib/repository";
import { slugify } from "@/lib/slugify";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { CompletionStatus } from "@/types/story";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_EXCEL_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

async function saveCoverImage(file: File, storySlug: string) {
  if (!file || file.size === 0) return null;
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return null;

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${storySlug}-${Date.now()}.${ext}`;
  const targetDir = path.join(process.cwd(), "public", "uploads", "covers");
  await mkdir(targetDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(targetDir, fileName), Buffer.from(bytes));
  return `/uploads/covers/${fileName}`;
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await loginAdmin(password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function createStoryAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const author = String(formData.get("author") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const tagsInput = String(formData.get("tags") ?? "");
  const completionStatusInput = String(formData.get("completionStatus") ?? "ongoing");
  const completionStatus: CompletionStatus =
    completionStatusInput === "completed" || completionStatusInput === "hiatus"
      ? completionStatusInput
      : "ongoing";
  const totalChaptersRaw = String(formData.get("totalChaptersPlanned") ?? "").trim();
  const totalChaptersPlanned = totalChaptersRaw ? Number(totalChaptersRaw) : null;
  const publishNow = formData.get("publishNow") === "on";
  const slugInput = String(formData.get("slug") ?? "");
  const slug = slugInput ? slugify(slugInput) : slugify(title);
  const chaptersInput = String(formData.get("chaptersJson") ?? "[]");
  const coverFile = formData.get("cover");

  if (!title || !summary || !author || !slug) redirect("/admin?tab=create&error=story");

  const coverUrl =
    coverFile instanceof File ? await saveCoverImage(coverFile, slug) : null;
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const chapterRows = parseChapterRows(chaptersInput);
  if (!chapterRows.length) redirect("/admin?tab=create&error=story");

  const story = await createStory({
    title,
    summary,
    slug,
    coverUrl,
    publishNow,
    author,
    category,
    completionStatus,
    totalChaptersPlanned:
      totalChaptersPlanned && Number.isFinite(totalChaptersPlanned) ? totalChaptersPlanned : null,
    tags,
  });

  for (const chapter of chapterRows) {
    await createChapter({
      storyId: story.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      slug: slugify(chapter.title),
      content: chapter.content,
      isPublished: publishNow,
    });
  }
  redirect("/admin?tab=create&created=story");
}

export async function deleteStoryAction(formData: FormData) {
  const id = String(formData.get("storyId") ?? "");
  if (!id) redirect("/admin?tab=stories&error=delete");
  const ok = await deleteStoryById(id);
  if (!ok) redirect("/admin?tab=stories&error=delete");
  redirect("/admin?tab=stories&deleted=1");
}

export async function addChapterToStoryAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const isPublished = formData.get("isPublished") === "on";
  if (!storyId || !title || !content) {
    redirect(`/admin/stories/${storyId}?error=chapter`);
  }
  const story = await getStoryByIdForAdmin(storyId);
  if (!story) redirect("/admin?tab=stories&error=chapter");
  const maxNum = Math.max(0, ...story.chapters.map((c) => c.chapterNumber));
  await createChapter({
    storyId,
    chapterNumber: maxNum + 1,
    title,
    slug: slugify(title),
    content,
    isPublished,
  });
  redirect(`/admin/stories/${storyId}?created=chapter`);
}

export async function updateChapterAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const chapterNumber = Number(formData.get("chapterNumber") ?? "0");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const isPublished = formData.get("isPublished") === "on";
  if (!storyId || !chapterId || !title || !content || !chapterNumber) {
    redirect(storyId ? `/admin/stories/${storyId}/chapters/${chapterId}?error=1` : "/admin?tab=stories");
  }
  const ok = await updateChapter({
    storyId,
    chapterId,
    chapterNumber,
    title,
    content,
    isPublished,
  });
  if (!ok) redirect(`/admin/stories/${storyId}/chapters/${chapterId}?error=1`);
  redirect(`/admin/stories/${storyId}/chapters/${chapterId}?saved=1`);
}

export async function deleteChapterAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!storyId || !chapterId) redirect("/admin?tab=stories&error=delete");
  const ok = await deleteChapterById(storyId, chapterId);
  if (!ok) redirect(`/admin/stories/${storyId}?error=delete`);
  redirect(`/admin/stories/${storyId}?deleted=chapter`);
}

function normalizeCompletionStatus(raw: string): CompletionStatus {
  const value = raw.trim().toLowerCase();
  if (value === "completed" || value === "hoan thanh") return "completed";
  if (value === "hiatus" || value === "tam ngung") return "hiatus";
  return "ongoing";
}

type ExcelStoryRow = {
  title?: string;
  slug?: string;
  summary?: string;
  description?: string;
  author?: string;
  tags?: string;
  category?: string;
  completionStatus?: string;
  totalChaptersPlanned?: number | string;
  publishNow?: string | number;
};

type ExcelChapterRow = {
  chapterNumber?: number | string;
  title?: string;
  slug?: string;
  content?: string;
  isPublished?: string | number;
};

type FlatTemplateRow = {
  title?: string;
  author?: string;
  summary?: string;
  tags?: string;
  completionStatus?: string;
  totalChaptersPlanned?: string | number;
  thumbnailUrl?: string;
  category?: string;
  chapterTitle?: string;
  chapterContent?: string;
};

type ChapterInput = {
  chapterNumber: number;
  title: string;
  content: string;
};

function toBoolean(raw: string | number | undefined) {
  if (typeof raw === "number") return raw === 1;
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "y", "co", "có"].includes(normalized);
}

function parseChapterRows(raw: string): ChapterInput[] {
  try {
    const parsed = JSON.parse(raw) as Array<{
      title?: string;
      content?: string;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => ({
        chapterNumber: index + 1,
        title: String(item.title ?? "").trim(),
        content: String(item.content ?? "").trim(),
      }))
      .filter((item) => item.title && item.content);
  } catch {
    return [];
  }
}

export async function importStoryFromExcelAction(formData: FormData) {
  const file = formData.get("excelFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?tab=create&error=excel");
  }

  if (file.type && !ACCEPTED_EXCEL_TYPES.has(file.type)) {
    redirect("/admin?tab=create&error=excel");
  }

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });

  const storySheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "story");
  const chapterSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "chapters");
  if (storySheetName && chapterSheetName) {
    const storyRows = XLSX.utils.sheet_to_json<ExcelStoryRow>(workbook.Sheets[storySheetName], {
      defval: "",
    });
    const chapterRows = XLSX.utils.sheet_to_json<ExcelChapterRow>(workbook.Sheets[chapterSheetName], {
      defval: "",
    });

    const storyRow = storyRows[0];
    if (!storyRow?.title || !storyRow?.summary) {
      redirect("/admin?tab=create&error=excel");
    }

    const slug = storyRow.slug ? slugify(storyRow.slug) : slugify(String(storyRow.title));
    const tags = String(storyRow.tags ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const totalChaptersParsed = Number(storyRow.totalChaptersPlanned ?? "");

    const story = await createStory({
      title: String(storyRow.title),
      summary: String(storyRow.summary ?? storyRow.description ?? "Đang cập nhật"),
      slug,
      coverUrl: null,
      publishNow: toBoolean(storyRow.publishNow),
      author: String(storyRow.author ?? "").trim() || null,
      category: String(storyRow.category ?? "").trim() || null,
      completionStatus: normalizeCompletionStatus(String(storyRow.completionStatus ?? "")),
      totalChaptersPlanned:
        Number.isFinite(totalChaptersParsed) && totalChaptersParsed > 0 ? totalChaptersParsed : null,
      tags,
    });

    for (const row of chapterRows) {
      const chapterTitle = String(row.title ?? "").trim();
      const chapterContent = String(row.content ?? "").trim();
      const number = Number(row.chapterNumber ?? 0);
      if (!chapterTitle || !chapterContent || !number) continue;

      const chapterSlug = row.slug ? slugify(String(row.slug)) : slugify(chapterTitle);
      await createChapter({
        storyId: story.id,
        chapterNumber: number,
        title: chapterTitle,
        slug: chapterSlug,
        content: chapterContent,
        isPublished: toBoolean(row.isPublished),
      });
    }

    redirect("/admin?tab=create&created=excel");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    redirect("/admin?tab=create&error=excel");
  }

  const rows = XLSX.utils.sheet_to_json<FlatTemplateRow>(workbook.Sheets[firstSheetName], {
    defval: "",
  });
  if (!rows.length) {
    redirect("/admin?tab=create&error=excel");
  }

  const storyMap = new Map<string, { storyId: string; chapterCount: number }>();
  for (const row of rows) {
    const title = String(row.title ?? "").trim();
    if (!title) continue;

    const author = String(row.author ?? "").trim() || null;
    const storyKey = `${title}::${author ?? ""}`;
    let storyState = storyMap.get(storyKey);

    if (!storyState) {
      const summary = String(row.summary ?? "").trim() || "Đang cập nhật";
      const tags = String(row.tags ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const totalChaptersParsed = Number(row.totalChaptersPlanned ?? "");
      const story = await createStory({
        title,
        summary,
        slug: slugify(title),
        coverUrl: null,
        publishNow: true,
        author,
        category: String(row.category ?? "").trim() || null,
        completionStatus: normalizeCompletionStatus(String(row.completionStatus ?? "")),
        totalChaptersPlanned:
          Number.isFinite(totalChaptersParsed) && totalChaptersParsed > 0 ? totalChaptersParsed : null,
        tags,
      });
      storyState = { storyId: story.id, chapterCount: 0 };
      storyMap.set(storyKey, storyState);
    }

    const chapterTitle = String(row.chapterTitle ?? "").trim();
    const chapterContent = String(row.chapterContent ?? "").trim();
    if (!chapterTitle || !chapterContent) continue;
    storyState.chapterCount += 1;

    await createChapter({
      storyId: storyState.storyId,
      chapterNumber: storyState.chapterCount,
      title: chapterTitle,
      slug: slugify(chapterTitle),
      content: chapterContent,
      isPublished: true,
    });
  }

  if (!storyMap.size) {
    redirect("/admin?tab=create&error=excel");
  }

  redirect("/admin?tab=create&created=excel");
}
