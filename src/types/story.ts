export type StoryStatus = "draft" | "published";
export type CompletionStatus = "ongoing" | "completed" | "hiatus";

export type Story = {
  id: string;
  title: string;
  author?: string | null;
  slug: string;
  summary: string;
  coverUrl: string | null;
  status: StoryStatus;
  isFeatured?: boolean;
  completionStatus?: CompletionStatus;
  category?: string | null;
  categoryId?: string | null;
  totalChaptersPlanned?: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type StoryWithChapters = Story & {
  tags: Tag[];
  chapters: Chapter[];
};

export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  storyCount: number;
};
