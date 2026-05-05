import { slugify } from "@/lib/slugify";
import { getSupabaseAdminClient, getSupabasePublicClient } from "@/lib/supabase/server";
import { Chapter, CompletionStatus, StoryWithChapters, Tag } from "@/types/story";

type StoryRow = {
  id: string;
  title: string;
  author: string | null;
  slug: string;
  summary: string;
  cover_url: string | null;
  status: "draft" | "published";
  completion_status: CompletionStatus;
  category: string | null;
  total_chapters_planned: number | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
};

type StoryTagRow = {
  story_id: string;
  tag_id: string;
};

function mapStoryRow(row: StoryRow): StoryWithChapters {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    slug: row.slug,
    summary: row.summary,
    coverUrl: row.cover_url,
    status: row.status,
    completionStatus: row.completion_status,
    category: row.category,
    totalChaptersPlanned: row.total_chapters_planned,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
    chapters: [],
  };
}

function mapChapterRow(row: ChapterRow): Chapter {
  return {
    id: row.id,
    storyId: row.story_id,
    chapterNumber: row.chapter_number,
    title: row.title,
    slug: row.slug,
    content: row.content,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadStoriesForPublic() {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [] as StoryWithChapters[];

  const { data: storyRows } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (!storyRows?.length) return [];

  const storyIds = storyRows.map((s) => s.id);

  const [{ data: chapterRows }, { data: storyTagRows }, { data: tagRows }] = await Promise.all([
    supabase
      .from("chapters")
      .select("*")
      .in("story_id", storyIds)
      .eq("is_published", true)
      .order("chapter_number", { ascending: true }),
    supabase.from("story_tags").select("story_id, tag_id").in("story_id", storyIds),
    supabase.from("tags").select("id, name, slug"),
  ]);

  const tagsById = new Map<string, Tag>((tagRows ?? []).map((row: TagRow) => [row.id, row]));
  const chaptersByStoryId = new Map<string, Chapter[]>();
  for (const row of chapterRows ?? []) {
    const chapter = mapChapterRow(row as ChapterRow);
    if (!chaptersByStoryId.has(chapter.storyId)) chaptersByStoryId.set(chapter.storyId, []);
    chaptersByStoryId.get(chapter.storyId)!.push(chapter);
  }

  const tagsByStoryId = new Map<string, Tag[]>();
  for (const row of storyTagRows ?? []) {
    const link = row as StoryTagRow;
    const tag = tagsById.get(link.tag_id);
    if (!tag) continue;
    if (!tagsByStoryId.has(link.story_id)) tagsByStoryId.set(link.story_id, []);
    tagsByStoryId.get(link.story_id)!.push(tag);
  }

  return (storyRows as StoryRow[]).map((row) => {
    const story = mapStoryRow(row);
    story.chapters = chaptersByStoryId.get(story.id) ?? [];
    story.tags = tagsByStoryId.get(story.id) ?? [];
    return story;
  });
}

async function loadStoriesForAdmin() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [] as StoryWithChapters[];

  const { data: storyRows } = await supabase.from("stories").select("*").order("updated_at", { ascending: false });
  if (!storyRows?.length) return [];

  const storyIds = storyRows.map((s) => s.id);
  const [{ data: chapterRows }, { data: storyTagRows }, { data: tagRows }] = await Promise.all([
    supabase.from("chapters").select("*").in("story_id", storyIds).order("chapter_number", { ascending: true }),
    supabase.from("story_tags").select("story_id, tag_id").in("story_id", storyIds),
    supabase.from("tags").select("id, name, slug"),
  ]);

  const tagsById = new Map<string, Tag>((tagRows ?? []).map((row: TagRow) => [row.id, row]));
  const chaptersByStoryId = new Map<string, Chapter[]>();
  for (const row of chapterRows ?? []) {
    const chapter = mapChapterRow(row as ChapterRow);
    if (!chaptersByStoryId.has(chapter.storyId)) chaptersByStoryId.set(chapter.storyId, []);
    chaptersByStoryId.get(chapter.storyId)!.push(chapter);
  }

  const tagsByStoryId = new Map<string, Tag[]>();
  for (const row of storyTagRows ?? []) {
    const link = row as StoryTagRow;
    const tag = tagsById.get(link.tag_id);
    if (!tag) continue;
    if (!tagsByStoryId.has(link.story_id)) tagsByStoryId.set(link.story_id, []);
    tagsByStoryId.get(link.story_id)!.push(tag);
  }

  return (storyRows as StoryRow[]).map((row) => {
    const story = mapStoryRow(row);
    story.chapters = chaptersByStoryId.get(story.id) ?? [];
    story.tags = tagsByStoryId.get(story.id) ?? [];
    return story;
  });
}

function filterPublishedStories(stories: StoryWithChapters[]) {
  return stories.filter((story) => story.status === "published");
}

export async function getHomeData() {
  const publishedStories = await loadStoriesForPublic();
  return {
    featured: publishedStories.filter((story) => story.isFeatured),
    newest: publishedStories.slice(0, 12),
    full: publishedStories.filter((story) => story.chapters.length >= 2),
  };
}

export async function getStoriesByTag(tagSlug?: string) {
  const publishedStories = await loadStoriesForPublic();
  if (!tagSlug) return publishedStories;
  return publishedStories.filter((story) => story.tags.some((tag) => tag.slug === tagSlug));
}

export async function getStoriesByCategory(category?: string) {
  const publishedStories = await loadStoriesForPublic();
  if (!category) return publishedStories;
  return publishedStories.filter((story) => (story.category ?? "").toLowerCase() === category.toLowerCase());
}

export async function getStoriesByTheLoai(theLoai?: string) {
  const publishedStories = await loadStoriesForPublic();
  if (!theLoai) return publishedStories;
  const label = decodeURIComponent(theLoai).trim().toLowerCase();
  if (!label) return publishedStories;
  return publishedStories.filter((story) => story.tags.some((tag) => tag.name.trim().toLowerCase() === label));
}

export async function getAllCategories() {
  const stories = await loadStoriesForAdmin();
  return Array.from(new Set(stories.map((story) => story.category?.trim()).filter((v): v is string => Boolean(v)))).sort(
    (a, b) => a.localeCompare(b, "vi"),
  );
}

export async function getAllTags(): Promise<Tag[]> {
  const stories = await loadStoriesForAdmin();
  const map = new Map<string, Tag>();
  stories.forEach((story) => {
    story.tags.forEach((tag) => {
      if (!map.has(tag.id)) map.set(tag.id, tag);
    });
  });
  return [...map.values()];
}

export async function searchStories(query: string) {
  const publishedStories = await loadStoriesForPublic();
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return publishedStories.filter((story) => {
    const haystack = [story.title, story.summary, ...story.tags.map((t) => t.name)].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function getStoryBySlug(slug: string) {
  const stories = await loadStoriesForPublic();
  return filterPublishedStories(stories).find((story) => story.slug === slug);
}

export async function getChapterBySlug(storySlug: string, chapterSlug: string) {
  const story = await getStoryBySlug(storySlug);
  if (!story) return null;
  const chapters = story.chapters.filter((chapter) => chapter.isPublished).sort((a, b) => a.chapterNumber - b.chapterNumber);
  const chapter = chapters.find((item) => item.slug === chapterSlug);
  if (!chapter) return null;
  const currentIndex = chapters.findIndex((item) => item.id === chapter.id);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  return { story, chapter, prev, next };
}

export async function listAdminStories() {
  return loadStoriesForAdmin();
}

export type StoryCategoryGroup = {
  categoryLabel: string;
  stories: StoryWithChapters[];
};

export function groupStoriesByCategoryLabel(stories: StoryWithChapters[]): StoryCategoryGroup[] {
  const map = new Map<string, StoryWithChapters[]>();
  for (const story of stories) {
    const label = story.category?.trim() || "Chưa có danh mục";
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(story);
  }
  return [...map.entries()]
    .map(([categoryLabel, list]) => ({
      categoryLabel,
      stories: [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel, "vi"));
}

export async function deleteStoryById(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const { error } = await supabase.from("stories").delete().eq("id", id);
  return !error;
}

export async function getStoryByIdForAdmin(id: string): Promise<StoryWithChapters | null> {
  const stories = await loadStoriesForAdmin();
  return stories.find((s) => s.id === id) ?? null;
}

export async function updateChapter(input: {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  content: string;
  isPublished: boolean;
}): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chapters")
    .update({
      chapter_number: input.chapterNumber,
      title: input.title,
      slug: slugify(input.title),
      content: input.content,
      is_published: input.isPublished,
      published_at: input.isPublished ? now : null,
      updated_at: now,
    })
    .eq("id", input.chapterId)
    .eq("story_id", input.storyId);

  if (error) return false;
  await supabase.from("stories").update({ updated_at: now }).eq("id", input.storyId);
  return true;
}

export async function deleteChapterById(storyId: string, chapterId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId).eq("story_id", storyId);
  if (error) return false;
  await supabase.from("stories").update({ updated_at: new Date().toISOString() }).eq("id", storyId);
  return true;
}

export async function createStory(input: {
  title: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  publishNow: boolean;
  author: string | null;
  category: string | null;
  completionStatus: CompletionStatus;
  totalChaptersPlanned: number | null;
  tags: string[];
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase admin client not configured");

  const now = new Date().toISOString();
  const { data: storyRow, error: storyError } = await supabase
    .from("stories")
    .insert({
      title: input.title,
      author: input.author,
      slug: input.slug,
      summary: input.summary,
      cover_url: input.coverUrl,
      status: input.publishNow ? "published" : "draft",
      completion_status: input.completionStatus,
      category: input.category,
      total_chapters_planned: input.totalChaptersPlanned,
      is_featured: false,
      published_at: input.publishNow ? now : null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (storyError || !storyRow) throw storyError ?? new Error("Failed to create story");

  for (const name of input.tags) {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    const { data: tagRow } = await supabase.from("tags").upsert({ name, slug }, { onConflict: "slug" }).select("*").single();
    if (tagRow) {
      await supabase.from("story_tags").upsert({ story_id: storyRow.id, tag_id: tagRow.id });
    }
  }

  const mapped = mapStoryRow(storyRow as StoryRow);
  const adminStory = await getStoryByIdForAdmin(mapped.id);
  return adminStory ?? mapped;
}

export async function createChapter(input: {
  storyId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  await supabase.from("chapters").insert({
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

  await supabase.from("stories").update({ updated_at: now }).eq("id", input.storyId);
}
