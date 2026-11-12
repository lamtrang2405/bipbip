import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { slugify } from "@/lib/slugify";
import { Chapter, CompletionStatus, StoryStatus, StoryWithChapters, Tag } from "@/types/story";

const STORY_COLUMNS = `
  id,
  title,
  slug,
  summary,
  cover_url,
  status,
  is_featured,
  published_at,
  created_at,
  updated_at,
  author,
  category,
  completion_status,
  total_chapters_planned
`;

const STORY_RELATIONS = `
  chapters (
    id,
    story_id,
    chapter_number,
    title,
    slug,
    content,
    is_published,
    published_at,
    created_at,
    updated_at
  ),
  story_tags (
    tags ( id, name, slug )
  )
`;

const STORY_SELECT = `${STORY_COLUMNS}, ${STORY_RELATIONS}`;
/** Danh sách public: không kèm nội dung chương (trang chủ, danh sách, tìm kiếm). */
const STORY_LIST_SELECT = `${STORY_COLUMNS}, ${STORY_RELATIONS.replace(/\n\s*content,/, "")}`;
/** `category_id` chỉ có sau migration 20261111_cms_taxonomy.sql. */
const ADMIN_STORY_SELECT = `${STORY_COLUMNS}, category_id, ${STORY_RELATIONS}`;

type ChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  content?: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type StoryRowBase = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_url: string | null;
  status: StoryStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: string | null;
  category: string | null;
  category_id?: string | null;
  completion_status: string | null;
  total_chapters_planned: number | null;
};

type StoryRowJoined = StoryRowBase & {
  chapters?: ChapterRow[] | null;
  /** PostgREST có thể trả `tags` là object hoặc mảng tùy embed. */
  story_tags?: { tags: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null }[] | null;
};

export function isSchemaMissingError(error: PostgrestError | { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code && ["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code)) return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist");
}

function requireService(): SupabaseClient {
  const service = getSupabaseServiceRoleClient();
  if (!service) throw new Error("Supabase service client không khả dụng");
  return service;
}

function mapCompletion(raw: string | null | undefined): CompletionStatus {
  if (raw === "completed" || raw === "hiatus") return raw;
  return "ongoing";
}

function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    storyId: row.story_id,
    chapterNumber: row.chapter_number,
    title: row.title,
    slug: row.slug,
    content: row.content ?? "",
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTags(row: StoryRowJoined): Tag[] {
  const links = row.story_tags ?? [];
  const out: Tag[] = [];
  for (const link of links) {
    let t = link.tags;
    if (Array.isArray(t)) t = t[0] ?? null;
    if (t && typeof t === "object" && "id" in t) {
      out.push({ id: t.id, name: t.name, slug: t.slug });
    }
  }
  return out;
}

function mapStoryRow(row: StoryRowJoined): StoryWithChapters {
  const chapters = (row.chapters ?? [])
    .slice()
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map(mapChapter);

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    slug: row.slug,
    summary: row.summary,
    coverUrl: row.cover_url,
    status: row.status,
    isFeatured: row.is_featured,
    completionStatus: mapCompletion(row.completion_status),
    category: row.category,
    categoryId: row.category_id ?? null,
    totalChaptersPlanned: row.total_chapters_planned,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: mapTags(row),
    chapters,
  };
}

async function fetchStoriesOrdered(client: SupabaseClient, select: string): Promise<StoryWithChapters[]> {
  const { data, error } = await client
    .from("stories")
    .select(select)
    .order("updated_at", { ascending: false });

  if (error && select === ADMIN_STORY_SELECT && isSchemaMissingError(error)) {
    return fetchStoriesOrdered(client, STORY_SELECT);
  }
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as StoryRowJoined[];
  return rows.map(mapStoryRow);
}

/** Chương trả về có `content` rỗng; dùng `sbGetStoryBySlugPublic` khi cần nội dung. */
export async function sbFetchPublishedStories(): Promise<StoryWithChapters[]> {
  const client = getSupabasePublicClient();
  if (!client) return [];
  return fetchStoriesOrdered(client, STORY_LIST_SELECT);
}

export async function sbFetchAllStoriesAdmin(): Promise<StoryWithChapters[]> {
  const client = getSupabaseServiceRoleClient();
  if (!client) return [];
  return fetchStoriesOrdered(client, ADMIN_STORY_SELECT);
}

export async function sbGetStoryBySlugPublic(slug: string): Promise<StoryWithChapters | null> {
  const client = getSupabasePublicClient();
  if (!client) return null;
  const { data, error } = await client
    .from("stories")
    .select(STORY_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapStoryRow(data as unknown as StoryRowJoined);
}

export async function sbGetStoryByIdAdmin(id: string): Promise<StoryWithChapters | null> {
  const client = getSupabaseServiceRoleClient();
  if (!client) return null;
  let { data, error } = await client
    .from("stories")
    .select(ADMIN_STORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error && isSchemaMissingError(error)) {
    ({ data, error } = await client.from("stories").select(STORY_SELECT).eq("id", id).maybeSingle());
  }
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapStoryRow(data as unknown as StoryRowJoined);
}

async function touchStoryUpdatedAt(service: SupabaseClient, storyId: string) {
  await service
    .from("stories")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", storyId);
}

export async function sbDeleteStoryById(id: string): Promise<boolean> {
  const service = getSupabaseServiceRoleClient();
  if (!service) return false;
  const { data: row } = await service.from("stories").select("id").eq("id", id).maybeSingle();
  if (!row) return false;
  const { error } = await service.from("stories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function sbUpdateChapter(input: {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  content: string;
  isPublished: boolean;
}): Promise<boolean> {
  const service = getSupabaseServiceRoleClient();
  if (!service) return false;

  const now = new Date().toISOString();
  const { data: existing, error: readErr } = await service
    .from("chapters")
    .select("published_at")
    .eq("id", input.chapterId)
    .eq("story_id", input.storyId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!existing) return false;

  const publishedAt = input.isPublished
    ? ((existing as { published_at: string | null }).published_at ?? now)
    : null;

  const { error } = await service
    .from("chapters")
    .update({
      chapter_number: input.chapterNumber,
      title: input.title,
      content: input.content,
      is_published: input.isPublished,
      published_at: publishedAt,
      updated_at: now,
    })
    .eq("id", input.chapterId)
    .eq("story_id", input.storyId);

  if (error) throw new Error(error.message);
  await touchStoryUpdatedAt(service, input.storyId);
  return true;
}

export async function sbDeleteChapterById(storyId: string, chapterId: string): Promise<boolean> {
  const service = getSupabaseServiceRoleClient();
  if (!service) return false;
  const { data: row } = await service
    .from("chapters")
    .select("id")
    .eq("id", chapterId)
    .eq("story_id", storyId)
    .maybeSingle();
  if (!row) return false;
  const { error } = await service.from("chapters").delete().eq("id", chapterId).eq("story_id", storyId);
  if (error) throw new Error(error.message);
  await touchStoryUpdatedAt(service, storyId);
  return true;
}

/** Tạo thể loại còn thiếu theo slug (không đổi tên thể loại đã có) và trả về bản ghi. */
export async function sbEnsureTags(names: string[]): Promise<Tag[]> {
  const service = requireService();
  const bySlug = new Map<string, string>();
  for (const raw of names) {
    const name = raw.replace(/^[\s|]+|[\s|]+$/g, "");
    const slug = slugify(name);
    if (name && slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  if (!bySlug.size) return [];

  const { error: upsertErr } = await service
    .from("tags")
    .upsert(
      [...bySlug.entries()].map(([slug, name]) => ({ name, slug })),
      { onConflict: "slug", ignoreDuplicates: true },
    );
  if (upsertErr) throw new Error(upsertErr.message);

  const { data, error } = await service
    .from("tags")
    .select("id, name, slug")
    .in("slug", [...bySlug.keys()]);
  if (error) throw new Error(error.message);
  return (data ?? []) as Tag[];
}

async function replaceStoryTags(service: SupabaseClient, storyId: string, tagIds: string[]) {
  const { error: delErr } = await service.from("story_tags").delete().eq("story_id", storyId);
  if (delErr) throw new Error(delErr.message);
  const unique = [...new Set(tagIds)];
  if (!unique.length) return;
  const { error } = await service
    .from("story_tags")
    .insert(unique.map((tagId) => ({ story_id: storyId, tag_id: tagId })));
  if (error) throw new Error(error.message);
}

async function resolveTagIds(tagIds: string[], tagNames: string[]) {
  const created = tagNames.length ? await sbEnsureTags(tagNames) : [];
  return [...new Set([...tagIds, ...created.map((t) => t.id)])];
}

async function resolveCategoryName(service: SupabaseClient, categoryId: string | null) {
  if (!categoryId) return null;
  const { data, error } = await service.from("categories").select("name").eq("id", categoryId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { name: string } | null)?.name ?? null;
}

export async function sbIsStorySlugTaken(slug: string, exceptId?: string) {
  const service = requireService();
  let query = service.from("stories").select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

export type StoryWriteInput = {
  title: string;
  slug: string;
  summary: string;
  author: string | null;
  /** Dùng khi chưa có bảng `categories` (dữ liệu cũ). Bị bỏ qua nếu có `categoryId`. */
  category?: string | null;
  categoryId?: string | null;
  completionStatus: CompletionStatus;
  totalChaptersPlanned: number | null;
  coverUrl: string | null;
  status: StoryStatus;
  isFeatured: boolean;
  tagIds?: string[];
  tagNames?: string[];
};

export async function sbCreateStory(input: StoryWriteInput): Promise<StoryWithChapters> {
  const service = requireService();
  const now = new Date().toISOString();
  const categoryName = input.categoryId
    ? await resolveCategoryName(service, input.categoryId)
    : (input.category ?? null);

  const row: Record<string, unknown> = {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    cover_url: input.coverUrl,
    status: input.status,
    is_featured: input.isFeatured,
    published_at: input.status === "published" ? now : null,
    author: input.author,
    category: categoryName,
    completion_status: input.completionStatus,
    total_chapters_planned: input.totalChaptersPlanned,
    created_at: now,
    updated_at: now,
  };
  if (input.categoryId) row.category_id = input.categoryId;

  const { data: storyRow, error: storyErr } = await service.from("stories").insert(row).select("id").single();
  if (storyErr) throw new Error(storyErr.message);
  const storyId = (storyRow as { id: string }).id;

  const tagIds = await resolveTagIds(input.tagIds ?? [], input.tagNames ?? []);
  await replaceStoryTags(service, storyId, tagIds);

  const created = await sbGetStoryByIdAdmin(storyId);
  if (!created) throw new Error("Không đọc lại được truyện vừa tạo");
  return created;
}

export type StoryUpdateResult = { ok: true } | { ok: false; reason: "not_found" | "slug_taken" };

/** `coverUrl === undefined` nghĩa là giữ ảnh bìa hiện tại. */
export async function sbUpdateStory(
  id: string,
  input: Omit<StoryWriteInput, "coverUrl"> & { coverUrl?: string | null },
): Promise<StoryUpdateResult> {
  const service = requireService();
  const { data: existing, error: readErr } = await service
    .from("stories")
    .select("id, published_at")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!existing) return { ok: false, reason: "not_found" };
  if (await sbIsStorySlugTaken(input.slug, id)) return { ok: false, reason: "slug_taken" };

  const now = new Date().toISOString();
  const prevPublishedAt = (existing as { published_at: string | null }).published_at;
  const row: Record<string, unknown> = {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    author: input.author,
    completion_status: input.completionStatus,
    total_chapters_planned: input.totalChaptersPlanned,
    status: input.status,
    is_featured: input.isFeatured,
    published_at: input.status === "published" ? (prevPublishedAt ?? now) : null,
    updated_at: now,
  };
  if (input.coverUrl !== undefined) row.cover_url = input.coverUrl;
  if (input.categoryId !== undefined) {
    row.category_id = input.categoryId;
    row.category = await resolveCategoryName(service, input.categoryId);
  } else if (input.category !== undefined) {
    row.category = input.category;
  }

  const { error } = await service.from("stories").update(row).eq("id", id);
  if (error) throw new Error(error.message);

  if (input.tagIds !== undefined || input.tagNames !== undefined) {
    const tagIds = await resolveTagIds(input.tagIds ?? [], input.tagNames ?? []);
    await replaceStoryTags(service, id, tagIds);
  }
  return { ok: true };
}

export async function sbSetStoryFlags(
  id: string,
  flags: { status?: StoryStatus; isFeatured?: boolean },
): Promise<boolean> {
  const service = requireService();
  const { data: existing, error: readErr } = await service
    .from("stories")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!existing) return false;

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (flags.isFeatured !== undefined) row.is_featured = flags.isFeatured;
  if (flags.status !== undefined) {
    row.status = flags.status;
    row.published_at =
      flags.status === "published"
        ? ((existing as { published_at: string | null }).published_at ?? new Date().toISOString())
        : null;
  }
  const { error } = await service.from("stories").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export type StoryPatch = Partial<{
  title: string;
  summary: string;
  author: string | null;
  category: string | null;
  categoryId: string | null;
  completionStatus: CompletionStatus;
  totalChaptersPlanned: number | null;
  coverUrl: string | null;
  status: StoryStatus;
  isFeatured: boolean;
  tagIds: string[];
}>;

/** Chỉ ghi các trường có trong `patch` (dùng cho import: ô trống = giữ nguyên). */
export async function sbPatchStory(id: string, patch: StoryPatch): Promise<void> {
  const service = requireService();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.summary !== undefined) row.summary = patch.summary;
  if (patch.author !== undefined) row.author = patch.author;
  if (patch.completionStatus !== undefined) row.completion_status = patch.completionStatus;
  if (patch.totalChaptersPlanned !== undefined) row.total_chapters_planned = patch.totalChaptersPlanned;
  if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.categoryId !== undefined) {
    row.category_id = patch.categoryId;
    row.category = await resolveCategoryName(service, patch.categoryId);
  } else if (patch.category !== undefined) {
    row.category = patch.category;
  }
  if (patch.status !== undefined) {
    const { data: existing, error: readErr } = await service
      .from("stories")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    row.status = patch.status;
    row.published_at =
      patch.status === "published"
        ? ((existing as { published_at: string | null } | null)?.published_at ?? new Date().toISOString())
        : null;
  }

  const { error } = await service.from("stories").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  if (patch.tagIds !== undefined) await replaceStoryTags(service, id, patch.tagIds);
}

export async function sbCreateChapter(input: {
  storyId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}): Promise<void> {
  const service = getSupabaseServiceRoleClient();
  if (!service) return;

  const now = new Date().toISOString();
  const { error } = await service.from("chapters").insert({
    story_id: input.storyId,
    chapter_number: input.chapterNumber,
    title: input.title,
    slug: input.slug,
    content: input.content,
    is_published: input.isPublished,
    published_at: input.isPublished ? now : null,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);
  await touchStoryUpdatedAt(service, input.storyId);
}

export type ImportTargetStory = {
  id: string;
  slug: string;
  title: string;
  chapters: { chapterNumber: number; slug: string; publishedAt: string | null }[];
};

/** Bản nhẹ (không có nội dung chương) để đối chiếu khi import. */
export async function sbGetImportTargets(slugs: string[]): Promise<Map<string, ImportTargetStory>> {
  const service = requireService();
  const out = new Map<string, ImportTargetStory>();
  const unique = [...new Set(slugs)];
  for (let i = 0; i < unique.length; i += 100) {
    const { data, error } = await service
      .from("stories")
      .select("id, slug, title, chapters ( chapter_number, slug, published_at )")
      .in("slug", unique.slice(i, i + 100));
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as {
      id: string;
      slug: string;
      title: string;
      chapters: { chapter_number: number; slug: string; published_at: string | null }[] | null;
    }[]) {
      out.set(row.slug, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        chapters: (row.chapters ?? []).map((c) => ({
          chapterNumber: c.chapter_number,
          slug: c.slug,
          publishedAt: c.published_at,
        })),
      });
    }
  }
  return out;
}

export type ChapterUpsertRow = {
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
};

const CHAPTER_UPSERT_BATCH = 50;

export async function sbUpsertChapters(storyId: string, rows: ChapterUpsertRow[]) {
  if (!rows.length) return;
  const service = requireService();
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += CHAPTER_UPSERT_BATCH) {
    const batch = rows.slice(i, i + CHAPTER_UPSERT_BATCH).map((r) => ({
      story_id: storyId,
      chapter_number: r.chapterNumber,
      title: r.title,
      slug: r.slug,
      content: r.content,
      is_published: r.isPublished,
      published_at: r.publishedAt,
      updated_at: now,
    }));
    const { error } = await service.from("chapters").upsert(batch, { onConflict: "story_id,chapter_number" });
    if (error) throw new Error(error.message);
  }
  await touchStoryUpdatedAt(service, storyId);
}
