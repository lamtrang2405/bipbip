import type { MetadataRoute } from "next";
import { getStoriesByTag } from "@/lib/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  try {
    const stories = await getStoriesByTag();
    const storyUrls = stories.map((story) => ({
      url: `${baseUrl}/stories/${story.slug}`,
      lastModified: new Date(story.updatedAt),
    }));
    return [{ url: baseUrl, lastModified: new Date() }, ...storyUrls];
  } catch {
    return [{ url: baseUrl, lastModified: new Date() }];
  }
}
