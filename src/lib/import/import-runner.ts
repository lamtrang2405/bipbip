import { isStoredCoverUrl, rehostCoverFromUrl } from "@/lib/covers";
import { CHAPTER_SHEET, STORY_SHEET } from "@/lib/import/sheet-template";
import type { CellValue, ParsedWorkbook } from "@/lib/import/parse-workbook";
import {
  sbCreateStory,
  sbEnsureTags,
  sbGetImportTargets,
  sbPatchStory,
  sbUpsertChapters,
  type ChapterUpsertRow,
  type StoryPatch,
} from "@/lib/repository-supabase";
import { slugify, uniqueChapterSlug } from "@/lib/slugify";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { ensureCategory, isTaxonomySchemaReady, listTaxonomy } from "@/lib/taxonomy";
import { CompletionStatus, StoryStatus } from "@/types/story";

export type ImportIssue = { sheet: string; row: number; message: string };

type PlannedChapter = {
  chapterNumber: number;
  title: string;
  content: string;
  isPublished: boolean;
  existingSlug?: string;
  existingPublishedAt?: string | null;
};

type PlannedStory = {
  slug: string;
  /** `chapters_only`: chỉ có dòng ở tab Chuong cho truyện đã có trên web. */
  action: "create" | "update" | "chapters_only";
  existingId?: string;
  existingTitle?: string;
  existingChapterSlugs: string[];
  title?: string;
  summary?: string;
  author?: string;
  categoryName?: string;
  tagNames?: string[];
  completionStatus?: CompletionStatus;
  totalChaptersPlanned?: number;
  coverUrl?: string;
  status?: StoryStatus;
  isFeatured?: boolean;
  chapters: PlannedChapter[];
};

export type ImportPlan = {
  format: ParsedWorkbook["format"];
  stories: PlannedStory[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  newTags: string[];
  newCategories: string[];
};

export type ImportPreview = {
  format: ParsedWorkbook["format"];
  stats: {
    storiesCreate: number;
    storiesUpdate: number;
    chaptersInsert: number;
    chaptersOverwrite: number;
  };
  stories: {
    slug: string;
    title: string;
    action: PlannedStory["action"];
    chaptersInsert: number;
    chaptersOverwrite: number;
    category: string | null;
    tags: string[] | null;
    status: StoryStatus | null;
    isFeatured: boolean | null;
  }[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  newTags: string[];
  newCategories: string[];
};

export type ImportResult = {
  status: "success" | "partial" | "failed";
  storiesCreated: number;
  storiesUpdated: number;
  chaptersWritten: number;
  failures: { slug: string; message: string }[];
  warnings: string[];
};

const TRUE_VALUES = new Set(["true", "1", "co", "x", "yes", "y", "dung"]);
const FALSE_VALUES = new Set(["false", "0", "khong", "no", "n", "sai"]);
const COMPLETION_VALUES: Record<string, CompletionStatus> = {
  ongoing: "ongoing",
  "dang-ra": "ongoing",
  "dang-tien-hanh": "ongoing",
  "dang-cap-nhat": "ongoing",
  completed: "completed",
  "hoan-thanh": "completed",
  "da-hoan-thanh": "completed",
  full: "completed",
  hiatus: "hiatus",
  "tam-ngung": "hiatus",
  "tam-dung": "hiatus",
};
const MAX_CELL_CHARS = 50_000;

function text(value: CellValue | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function bool(value: CellValue | undefined): boolean | undefined | "invalid" {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const key = slugify(String(value));
  if (TRUE_VALUES.has(key)) return true;
  if (FALSE_VALUES.has(key)) return false;
  return "invalid";
}

function positiveInt(value: CellValue | undefined): number | undefined | "invalid" {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : "invalid";
}

function splitTags(value: string) {
  return [...new Set(value.split(/[,|;]/).map((t) => t.trim()).filter(Boolean))];
}

export async function buildImportPlan(parsed: ParsedWorkbook): Promise<ImportPlan> {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const err = (sheet: string, row: number, message: string) => errors.push({ sheet, row, message });
  const warn = (sheet: string, row: number, message: string) => warnings.push({ sheet, row, message });

  const rawCodes = [...parsed.storyRows, ...parsed.chapterRows]
    .map((r) => String(r.values.ma_truyen ?? "").trim())
    .filter(Boolean);
  const targets = await sbGetImportTargets([...rawCodes, ...rawCodes.map(slugify)].filter(Boolean));
  /** Slug cũ có thể không theo chuẩn hiện tại (vd. "-abc-"): khớp chính xác thì giữ nguyên. */
  const resolveCode = (raw: string) => (targets.has(raw) ? raw : slugify(raw));

  const planned = new Map<string, PlannedStory>();
  const invalidSlugs = new Set<string>();

  for (const { row, values } of parsed.storyRows) {
    const rawCode = text(values.ma_truyen);
    if (!rawCode) {
      err(STORY_SHEET, row, "Thiếu ma_truyen.");
      continue;
    }
    const slug = resolveCode(rawCode);
    if (!slug) {
      err(STORY_SHEET, row, `ma_truyen "${rawCode}" không hợp lệ.`);
      continue;
    }
    if (slug !== rawCode) warn(STORY_SHEET, row, `ma_truyen "${rawCode}" được chuẩn hóa thành "${slug}".`);
    if (planned.has(slug) || invalidSlugs.has(slug)) {
      err(STORY_SHEET, row, `ma_truyen "${slug}" bị lặp trong sheet, dòng này bị bỏ qua.`);
      continue;
    }

    const existing = targets.get(slug);
    const title = text(values.tieu_de);
    if (!existing && !title) {
      err(STORY_SHEET, row, `Truyện mới "${slug}" cần có tieu_de.`);
      invalidSlugs.add(slug);
      continue;
    }

    const story: PlannedStory = {
      slug,
      action: existing ? "update" : "create",
      existingId: existing?.id,
      existingTitle: existing?.title,
      existingChapterSlugs: existing?.chapters.map((c) => c.slug) ?? [],
      title,
      summary: text(values.tom_tat),
      author: text(values.tac_gia),
      categoryName: text(values.danh_muc),
      chapters: [],
    };

    const tagsRaw = text(values.the_loai);
    if (tagsRaw) story.tagNames = splitTags(tagsRaw);

    const completionRaw = text(values.trang_thai);
    if (completionRaw) {
      story.completionStatus = COMPLETION_VALUES[slugify(completionRaw)];
      if (!story.completionStatus) warn(STORY_SHEET, row, `trang_thai "${completionRaw}" không hợp lệ, bỏ qua.`);
    }

    const total = positiveInt(values.tong_chuong_du_kien);
    if (total === "invalid") warn(STORY_SHEET, row, "tong_chuong_du_kien phải là số nguyên dương, bỏ qua.");
    else story.totalChaptersPlanned = total;

    const cover = text(values.anh_bia_url);
    if (cover) {
      if (/^https?:\/\//i.test(cover)) story.coverUrl = cover;
      else warn(STORY_SHEET, row, "anh_bia_url phải là link http(s), bỏ qua.");
    }

    const published = bool(values.xuat_ban);
    if (published === "invalid") warn(STORY_SHEET, row, "xuat_ban phải là TRUE/FALSE, bỏ qua.");
    else if (published !== undefined) story.status = published ? "published" : "draft";

    const featured = bool(values.de_cu);
    if (featured === "invalid") warn(STORY_SHEET, row, "de_cu phải là TRUE/FALSE, bỏ qua.");
    else story.isFeatured = featured;

    planned.set(slug, story);
  }

  const seenChapters = new Set<string>();
  for (const { row, values } of parsed.chapterRows) {
    const slug = resolveCode(String(values.ma_truyen ?? "").trim());
    if (!slug) {
      err(CHAPTER_SHEET, row, "Thiếu ma_truyen.");
      continue;
    }
    if (invalidSlugs.has(slug)) {
      err(CHAPTER_SHEET, row, `Bỏ qua vì dòng truyện "${slug}" ở tab ${STORY_SHEET} bị lỗi.`);
      continue;
    }

    let story = planned.get(slug);
    if (!story) {
      const existing = targets.get(slug);
      if (!existing) {
        err(CHAPTER_SHEET, row, `ma_truyen "${slug}" không có ở tab ${STORY_SHEET} và chưa có trên web.`);
        continue;
      }
      story = {
        slug,
        action: "chapters_only",
        existingId: existing.id,
        existingTitle: existing.title,
        existingChapterSlugs: existing.chapters.map((c) => c.slug),
        chapters: [],
      };
      planned.set(slug, story);
    }

    const number = positiveInt(values.so_chuong);
    if (number === undefined || number === "invalid") {
      err(CHAPTER_SHEET, row, "so_chuong phải là số nguyên dương.");
      continue;
    }
    const key = `${slug}#${number}`;
    if (seenChapters.has(key)) {
      err(CHAPTER_SHEET, row, `Chương ${number} của "${slug}" bị lặp trong sheet, dòng này bị bỏ qua.`);
      continue;
    }

    const content = text(values.noi_dung);
    if (!content) {
      err(CHAPTER_SHEET, row, `Chương ${number} của "${slug}" thiếu noi_dung.`);
      continue;
    }
    if (content.length >= MAX_CELL_CHARS) {
      warn(CHAPTER_SHEET, row, `Chương ${number} dài ${content.length} ký tự, có thể đã bị Google Sheets cắt bớt.`);
    }

    const published = bool(values.xuat_ban);
    if (published === "invalid") warn(CHAPTER_SHEET, row, "xuat_ban phải là TRUE/FALSE, dùng mặc định TRUE.");

    seenChapters.add(key);
    const existingChapter = targets.get(slug)?.chapters.find((c) => c.chapterNumber === number);
    story.chapters.push({
      chapterNumber: number,
      title: text(values.tieu_de_chuong) ?? `Chương ${number}`,
      content,
      isPublished: published === undefined || published === "invalid" ? true : published,
      existingSlug: existingChapter?.slug,
      existingPublishedAt: existingChapter?.publishedAt,
    });
  }

  const [tagList, categoryList] = await Promise.all([listTaxonomy("tags"), listTaxonomy("categories")]);
  const knownTags = new Set(tagList.items.map((t) => t.slug));
  const knownCategories = new Set(categoryList.items.map((c) => c.slug));
  const newTags = new Map<string, string>();
  const newCategories = new Map<string, string>();
  for (const story of planned.values()) {
    for (const name of story.tagNames ?? []) {
      const s = slugify(name);
      if (s && !knownTags.has(s)) newTags.set(s, name);
    }
    if (story.categoryName && categoryList.schemaReady) {
      const s = slugify(story.categoryName);
      if (s && !knownCategories.has(s)) newCategories.set(s, story.categoryName);
    }
  }
  if (newTags.size) warnings.push({ sheet: STORY_SHEET, row: 0, message: `Sẽ tạo thể loại mới: ${[...newTags.values()].join(", ")}` });
  if (newCategories.size) warnings.push({ sheet: STORY_SHEET, row: 0, message: `Sẽ tạo danh mục mới: ${[...newCategories.values()].join(", ")}` });

  return {
    format: parsed.format,
    stories: [...planned.values()],
    errors,
    warnings,
    newTags: [...newTags.values()],
    newCategories: [...newCategories.values()],
  };
}

export function toPreview(plan: ImportPlan): ImportPreview {
  const stories = plan.stories.map((s) => {
    const overwrite = s.chapters.filter((c) => c.existingSlug).length;
    return {
      slug: s.slug,
      title: s.title ?? s.existingTitle ?? s.slug,
      action: s.action,
      chaptersInsert: s.chapters.length - overwrite,
      chaptersOverwrite: overwrite,
      category: s.categoryName ?? null,
      tags: s.tagNames ?? null,
      status: s.status ?? (s.action === "create" ? "published" : null),
      isFeatured: s.isFeatured ?? null,
    };
  });
  return {
    format: plan.format,
    stats: {
      storiesCreate: stories.filter((s) => s.action === "create").length,
      storiesUpdate: stories.filter((s) => s.action === "update").length,
      chaptersInsert: stories.reduce((n, s) => n + s.chaptersInsert, 0),
      chaptersOverwrite: stories.reduce((n, s) => n + s.chaptersOverwrite, 0),
    },
    stories,
    errors: plan.errors,
    warnings: plan.warnings,
    newTags: plan.newTags,
    newCategories: plan.newCategories,
  };
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function buildChapterRows(story: PlannedStory): ChapterUpsertRow[] {
  const now = new Date().toISOString();
  const taken = new Set(story.existingChapterSlugs);
  const sorted = [...story.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  return sorted.map((c) => ({
    chapterNumber: c.chapterNumber,
    title: c.title,
    slug: c.existingSlug ?? uniqueChapterSlug(c.title, c.chapterNumber, taken),
    content: c.content,
    isPublished: c.isPublished,
    publishedAt: c.isPublished ? (c.existingPublishedAt ?? now) : null,
  }));
}

export async function applyImportPlan(
  plan: ImportPlan,
  context: { source: "google_sheet" | "excel"; sourceUrl: string | null },
): Promise<ImportResult> {
  const result: ImportResult = {
    status: "success",
    storiesCreated: 0,
    storiesUpdated: 0,
    chaptersWritten: 0,
    failures: [],
    warnings: [],
  };

  const taxonomyReady = await isTaxonomySchemaReady();
  const tagIdBySlug = new Map(
    (await sbEnsureTags(plan.stories.flatMap((s) => s.tagNames ?? []))).map((t) => [t.slug, t.id]),
  );
  const categoryIdBySlug = new Map<string, string>();
  if (taxonomyReady) {
    for (const name of new Set(plan.stories.map((s) => s.categoryName).filter((n): n is string => Boolean(n)))) {
      const category = await ensureCategory(name);
      if (category) categoryIdBySlug.set(slugify(name), category.id);
    }
  }

  await runWithConcurrency(plan.stories, 3, async (story) => {
    try {
      let coverUrl: string | undefined;
      if (story.coverUrl) {
        coverUrl = isStoredCoverUrl(story.coverUrl)
          ? story.coverUrl
          : ((await rehostCoverFromUrl(story.coverUrl, story.slug)) ?? undefined);
        if (!coverUrl) result.warnings.push(`${story.slug}: không tải được ảnh bìa, giữ nguyên ảnh cũ.`);
      }

      const tagIds = story.tagNames
        ?.map((name) => tagIdBySlug.get(slugify(name)))
        .filter((id): id is string => Boolean(id));
      const categoryId = story.categoryName ? categoryIdBySlug.get(slugify(story.categoryName)) : undefined;

      let storyId = story.existingId;
      if (story.action === "create") {
        const created = await sbCreateStory({
          title: story.title ?? story.slug,
          slug: story.slug,
          summary: story.summary ?? "Đang cập nhật",
          author: story.author ?? null,
          categoryId: categoryId ?? null,
          category: categoryId ? undefined : (story.categoryName ?? null),
          completionStatus: story.completionStatus ?? "ongoing",
          totalChaptersPlanned: story.totalChaptersPlanned ?? null,
          coverUrl: coverUrl ?? null,
          status: story.status ?? "published",
          isFeatured: story.isFeatured ?? false,
          tagIds: tagIds ?? [],
        });
        storyId = created.id;
        result.storiesCreated += 1;
      } else if (story.action === "update" && storyId) {
        const patch: StoryPatch = {
          title: story.title,
          summary: story.summary,
          author: story.author,
          completionStatus: story.completionStatus,
          totalChaptersPlanned: story.totalChaptersPlanned,
          coverUrl,
          status: story.status,
          isFeatured: story.isFeatured,
          tagIds,
        };
        if (categoryId) patch.categoryId = categoryId;
        else if (story.categoryName) patch.category = story.categoryName;
        await sbPatchStory(storyId, patch);
        result.storiesUpdated += 1;
      }

      if (storyId && story.chapters.length) {
        await sbUpsertChapters(storyId, buildChapterRows(story));
        result.chaptersWritten += story.chapters.length;
      }
    } catch (error) {
      result.failures.push({ slug: story.slug, message: error instanceof Error ? error.message : String(error) });
    }
  });

  const succeeded = plan.stories.length - result.failures.length;
  if (result.failures.length) result.status = succeeded > 0 ? "partial" : "failed";
  else if (plan.errors.length) result.status = "partial";

  await recordImportJob(context, result, plan);
  return result;
}

async function recordImportJob(
  context: { source: "google_sheet" | "excel"; sourceUrl: string | null },
  result: ImportResult,
  plan: ImportPlan,
) {
  const service = getSupabaseServiceRoleClient();
  if (!service) return;
  await service.from("import_jobs").insert({
    source: context.source,
    source_url: context.sourceUrl,
    status: result.status,
    summary: {
      storiesCreated: result.storiesCreated,
      storiesUpdated: result.storiesUpdated,
      chaptersWritten: result.chaptersWritten,
      skippedRows: plan.errors.length,
      failures: result.failures.slice(0, 50),
      warnings: result.warnings.slice(0, 50),
    },
  });
}

export type ImportJob = {
  id: string;
  source: "google_sheet" | "excel";
  sourceUrl: string | null;
  status: ImportResult["status"];
  createdAt: string;
  summary: {
    storiesCreated?: number;
    storiesUpdated?: number;
    chaptersWritten?: number;
    skippedRows?: number;
    failures?: { slug: string; message: string }[];
  };
};

export async function listImportJobs(limit = 20): Promise<ImportJob[]> {
  const service = getSupabaseServiceRoleClient();
  if (!service) return [];
  const { data, error } = await service
    .from("import_jobs")
    .select("id, source, source_url, status, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      source: ImportJob["source"];
      source_url: string | null;
      status: ImportJob["status"];
      summary: ImportJob["summary"];
      created_at: string;
    };
    return { id: r.id, source: r.source, sourceUrl: r.source_url, status: r.status, summary: r.summary ?? {}, createdAt: r.created_at };
  });
}
