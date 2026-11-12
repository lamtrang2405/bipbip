"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createChapter,
  createStory,
  deleteChapterById,
  deleteStoryById,
  getStoryByIdForAdmin,
  setStoryCover,
  setStoryFlags,
  updateChapter,
  updateStory,
} from "@/lib/repository";
import { sbIsStorySlugTaken } from "@/lib/repository-supabase";
import { slugify, uniqueChapterSlug } from "@/lib/slugify";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth";
import { isStoredCoverUrl, rehostCoverFromUrl, saveCoverImage } from "@/lib/covers";
import { isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";
import { CompletionStatus, StoryStatus } from "@/types/story";

function revalidatePublicSite() {
  revalidatePath("/", "layout");
}

function safeAdminPath(raw: FormDataEntryValue | null, fallback: string) {
  const value = String(raw ?? "");
  return value.startsWith("/admin") && !value.startsWith("//") ? value : fallback;
}

function withQuery(path: string, query: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
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

function parseCompletionStatus(raw: FormDataEntryValue | null): CompletionStatus {
  const value = String(raw ?? "");
  return value === "completed" || value === "hiatus" ? value : "ongoing";
}

function parseTagNames(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(/[,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Đọc các trường của `StoryMetaFields`. */
function parseStoryMeta(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const totalRaw = String(formData.get("totalChaptersPlanned") ?? "").trim();
  const total = totalRaw ? Number(totalRaw) : NaN;
  const categoryIdRaw = formData.get("categoryId");
  const status: StoryStatus = String(formData.get("status") ?? "") === "published" ? "published" : "draft";

  return {
    title,
    slug: slugify(slugInput || title),
    summary: String(formData.get("summary") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim() || null,
    categoryId: categoryIdRaw === null ? undefined : String(categoryIdRaw) || null,
    category: String(formData.get("category") ?? "").trim() || null,
    completionStatus: parseCompletionStatus(formData.get("completionStatus")),
    totalChaptersPlanned: Number.isFinite(total) && total > 0 ? Math.trunc(total) : null,
    status,
    isFeatured: formData.get("isFeatured") === "on",
    tagIds: formData.getAll("tagIds").map(String).filter(Boolean),
    tagNames: parseTagNames(formData.get("newTags")),
  };
}

type ChapterInput = {
  chapterNumber: number;
  title: string;
  content: string;
};

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

type CoverChange = { kind: "none" } | { kind: "set"; url: string } | { kind: "remove" } | { kind: "error" };

/** Đọc `cover` (file), `coverUrl` (link) và `removeCover` của `CoverInput`. */
async function resolveCoverChange(formData: FormData, storySlug: string): Promise<CoverChange> {
  const file = formData.get("cover");
  if (file instanceof File && file.size > 0) {
    const url = await saveCoverImage(file, storySlug);
    return url ? { kind: "set", url } : { kind: "error" };
  }
  const link = String(formData.get("coverUrl") ?? "").trim();
  if (link) {
    if (isStoredCoverUrl(link)) return { kind: "set", url: link };
    const url = await rehostCoverFromUrl(link, storySlug);
    return url ? { kind: "set", url } : { kind: "error" };
  }
  return formData.get("removeCover") === "on" ? { kind: "remove" } : { kind: "none" };
}

export async function createStoryAction(formData: FormData) {
  await requireAdmin();
  const meta = parseStoryMeta(formData);
  if (!meta.title || !meta.summary || !meta.author || !meta.slug) redirect("/admin?tab=create&error=story");

  const chapterRows = parseChapterRows(String(formData.get("chaptersJson") ?? "[]"));
  if (!chapterRows.length) redirect("/admin?tab=create&error=story");

  if (isSupabaseCmsEnabled() && (await sbIsStorySlugTaken(meta.slug))) {
    redirect("/admin?tab=create&error=slug");
  }

  const cover = await resolveCoverChange(formData, meta.slug);
  if (cover.kind === "error") redirect("/admin?tab=create&error=cover");
  const story = await createStory({
    ...meta,
    categoryId: meta.categoryId ?? null,
    coverUrl: cover.kind === "set" ? cover.url : null,
  });

  const takenSlugs = new Set<string>();
  for (const chapter of chapterRows) {
    await createChapter({
      storyId: story.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      slug: uniqueChapterSlug(chapter.title, chapter.chapterNumber, takenSlugs),
      content: chapter.content,
      isPublished: meta.status === "published",
    });
  }
  revalidatePublicSite();
  redirect("/admin?tab=create&created=story");
}

export async function updateStoryAction(formData: FormData) {
  await requireAdmin();
  const storyId = String(formData.get("storyId") ?? "");
  const editPath = `/admin/stories/${storyId}/edit`;
  if (!storyId) redirect("/admin?tab=stories");

  const meta = parseStoryMeta(formData);
  if (!meta.title || !meta.summary || !meta.slug) redirect(`${editPath}?error=invalid`);

  const cover = await resolveCoverChange(formData, meta.slug);
  if (cover.kind === "error") redirect(`${editPath}?error=cover`);
  const coverUrl = cover.kind === "set" ? cover.url : cover.kind === "remove" ? null : undefined;

  const result = await updateStory(storyId, {
    ...meta,
    category: meta.categoryId === undefined ? meta.category : undefined,
    coverUrl,
  });
  if (!result.ok) {
    if (result.reason === "not_found") redirect("/admin?tab=stories");
    redirect(`${editPath}?error=slug`);
  }
  revalidatePublicSite();
  redirect(`${editPath}?saved=1`);
}

export async function updateStoryCoverAction(formData: FormData) {
  await requireAdmin();
  const storyId = String(formData.get("storyId") ?? "");
  const storySlug = String(formData.get("storySlug") ?? "") || storyId;
  const returnTo = safeAdminPath(formData.get("returnTo"), "/admin?tab=stories");
  if (!storyId) redirect(returnTo);

  const cover = await resolveCoverChange(formData, storySlug);
  if (cover.kind === "error") redirect(withQuery(returnTo, "cover=error"));
  if (cover.kind === "none") redirect(returnTo);
  await setStoryCover(storyId, cover.kind === "set" ? cover.url : null);
  revalidatePublicSite();
  redirect(withQuery(returnTo, "cover=ok"));
}

export async function toggleStoryFlagAction(formData: FormData) {
  await requireAdmin();
  const storyId = String(formData.get("storyId") ?? "");
  const flag = String(formData.get("flag") ?? "");
  const value = formData.get("value") === "1";
  const returnTo = safeAdminPath(formData.get("returnTo"), "/admin?tab=stories");
  if (!storyId || (flag !== "featured" && flag !== "published")) redirect(returnTo);

  await setStoryFlags(
    storyId,
    flag === "featured" ? { isFeatured: value } : { status: value ? "published" : "draft" },
  );
  revalidatePublicSite();
  redirect(returnTo);
}

export async function deleteStoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("storyId") ?? "");
  const returnTo = safeAdminPath(formData.get("returnTo"), "/admin?tab=stories");
  if (!id) redirect(withQuery(returnTo, "error=delete"));
  const ok = await deleteStoryById(id);
  if (!ok) redirect(withQuery(returnTo, "error=delete"));
  revalidatePublicSite();
  redirect(withQuery(returnTo, "deleted=1"));
}

export async function addChapterToStoryAction(formData: FormData) {
  await requireAdmin();
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
  const takenSlugs = new Set(story.chapters.map((c) => c.slug));
  await createChapter({
    storyId,
    chapterNumber: maxNum + 1,
    title,
    slug: uniqueChapterSlug(title, maxNum + 1, takenSlugs),
    content,
    isPublished,
  });
  revalidatePublicSite();
  redirect(`/admin/stories/${storyId}?created=chapter`);
}

export async function updateChapterAction(formData: FormData) {
  await requireAdmin();
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
  revalidatePublicSite();
  redirect(`/admin/stories/${storyId}/chapters/${chapterId}?saved=1`);
}

export async function deleteChapterAction(formData: FormData) {
  await requireAdmin();
  const storyId = String(formData.get("storyId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  if (!storyId || !chapterId) redirect("/admin?tab=stories&error=delete");
  const ok = await deleteChapterById(storyId, chapterId);
  if (!ok) redirect(`/admin/stories/${storyId}?error=delete`);
  revalidatePublicSite();
  redirect(`/admin/stories/${storyId}?deleted=chapter`);
}
