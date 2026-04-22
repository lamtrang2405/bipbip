export type AnalyticsEventName =
  | "page_view"
  | "story_view"
  | "chapter_view"
  | "search"
  | "next_chapter_click";

export type AnalyticsEventPayload = {
  eventName: AnalyticsEventName;
  path: string;
  storySlug?: string;
  chapterSlug?: string;
  query?: string;
  createdAt?: string;
};
