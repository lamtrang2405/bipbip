import { readStoriesFromStore, writeStoriesToStore } from "@/lib/cms-store";
import { slugify } from "@/lib/slugify";
import { Chapter, CompletionStatus, StoryWithChapters, Tag } from "@/types/story";

function filterPublishedStories(stories: StoryWithChapters[]) {
  return stories.filter((story) => story.status === "published");
}

export async function getHomeData() {
  const stories = await readStoriesFromStore();
  const publishedStories = filterPublishedStories(stories);

  return {
    featured: publishedStories.filter((story) => story.isFeatured),
    newest: publishedStories.slice(0, 12),
    full: publishedStories.filter(
      (story) => story.chapters.length >= 2 && story.status === "published",
    ),
  };
}

export async function getStoriesByTag(tagSlug?: string) {
  const stories = await readStoriesFromStore();
  const publishedStories = filterPublishedStories(stories);
  if (!tagSlug) return publishedStories;

  return publishedStories.filter((story) =>
    story.tags.some((tag) => tag.slug === tagSlug),
  );
}

export async function getStoriesByCategory(category?: string) {
  const stories = await readStoriesFromStore();
  const publishedStories = filterPublishedStories(stories);
  if (!category) return publishedStories;

  return publishedStories.filter(
    (story) => (story.category ?? "").toLowerCase() === category.toLowerCase(),
  );
}

/** Lọc theo tên thể loại (khớp với `story.tags[].name`, không phân biệt hoa thường). */
export async function getStoriesByTheLoai(theLoai?: string) {
  const stories = await readStoriesFromStore();
  const publishedStories = filterPublishedStories(stories);
  if (!theLoai) return publishedStories;

  const label = decodeURIComponent(theLoai).trim().toLowerCase();
  if (!label) return publishedStories;

  return publishedStories.filter((story) =>
    story.tags.some((tag) => tag.name.trim().toLowerCase() === label),
  );
}

export async function getAllCategories() {
  const stories = await readStoriesFromStore();
  return Array.from(
    new Set(
      stories
        .map((story) => story.category?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, "vi"));
}

export async function getAllTags(): Promise<Tag[]> {
  const stories = await readStoriesFromStore();
  const map = new Map<string, Tag>();

  stories.forEach((story) => {
    story.tags.forEach((tag) => {
      if (!map.has(tag.id)) {
        map.set(tag.id, tag);
      }
    });
  });

  return [...map.values()];
}

export async function searchStories(query: string) {
  const stories = await readStoriesFromStore();
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return filterPublishedStories(stories).filter((story) => {
    const haystack = [story.title, story.summary, ...story.tags.map((t) => t.name)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function getStoryBySlug(slug: string) {
  const stories = await readStoriesFromStore();
  return filterPublishedStories(stories).find((story) => story.slug === slug);
}

export async function getChapterBySlug(storySlug: string, chapterSlug: string) {
  const story = await getStoryBySlug(storySlug);
  if (!story) return null;

  const chapters = story.chapters
    .filter((chapter) => chapter.isPublished)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
  const chapter = chapters.find((item) => item.slug === chapterSlug);
  if (!chapter) return null;

  const currentIndex = chapters.findIndex((item) => item.id === chapter.id);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return { story, chapter, prev, next };
}

export async function listAdminStories() {
  return readStoriesFromStore();
}

export type StoryCategoryGroup = {
  categoryLabel: string;
  stories: StoryWithChapters[];
};

/** Nhóm truyện theo trường `category` (CMS), dùng màn quản lý theo danh mục. */
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
  const stories = await readStoriesFromStore();
  const next = stories.filter((s) => s.id !== id);
  if (next.length === stories.length) return false;
  await writeStoriesToStore(next);
  return true;
}

export async function getStoryByIdForAdmin(id: string): Promise<StoryWithChapters | null> {
  const stories = await readStoriesFromStore();
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
  const stories = await readStoriesFromStore();
  const story = stories.find((s) => s.id === input.storyId);
  if (!story) return false;
  const chapter = story.chapters.find((c) => c.id === input.chapterId);
  if (!chapter) return false;
  const now = new Date().toISOString();
  chapter.chapterNumber = input.chapterNumber;
  chapter.title = input.title;
  chapter.slug = slugify(input.title);
  chapter.content = input.content;
  chapter.isPublished = input.isPublished;
  chapter.updatedAt = now;
  if (input.isPublished) {
    chapter.publishedAt = chapter.publishedAt ?? now;
  } else {
    chapter.publishedAt = null;
  }
  story.updatedAt = now;
  await writeStoriesToStore(stories);
  return true;
}

export async function deleteChapterById(storyId: string, chapterId: string): Promise<boolean> {
  const stories = await readStoriesFromStore();
  const story = stories.find((s) => s.id === storyId);
  if (!story) return false;
  const before = story.chapters.length;
  story.chapters = story.chapters.filter((c) => c.id !== chapterId);
  if (story.chapters.length === before) return false;
  story.updatedAt = new Date().toISOString();
  await writeStoriesToStore(stories);
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
  const stories = await readStoriesFromStore();
  const now = new Date().toISOString();
  const story: StoryWithChapters = {
    id: `story-${crypto.randomUUID()}`,
    title: input.title,
    author: input.author,
    slug: input.slug,
    summary: input.summary,
    coverUrl: input.coverUrl,
    status: input.publishNow ? "published" : "draft",
    completionStatus: input.completionStatus,
    category: input.category,
    isFeatured: false,
    totalChaptersPlanned: input.totalChaptersPlanned,
    publishedAt: input.publishNow ? now : null,
    createdAt: now,
    updatedAt: now,
    tags: input.tags.map((name) => ({
      id: `tag-${crypto.randomUUID()}`,
      name,
      slug: name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    })),
    chapters: [],
  };
  stories.unshift(story);
  await writeStoriesToStore(stories);
  return story;
}

export async function createChapter(input: {
  storyId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}) {
  const stories = await readStoriesFromStore();
  const now = new Date().toISOString();
  const chapter: Chapter = {
    id: `chapter-${crypto.randomUUID()}`,
    storyId: input.storyId,
    chapterNumber: input.chapterNumber,
    title: input.title,
    slug: input.slug,
    content: input.content,
    isPublished: input.isPublished,
    publishedAt: input.isPublished ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  const story = stories.find((item) => item.id === input.storyId);
  if (story) {
    story.chapters.push(chapter);
    story.updatedAt = now;
    await writeStoriesToStore(stories);
  }
}
