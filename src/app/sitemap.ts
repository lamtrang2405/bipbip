import { MetadataRoute } from "next";
import { sampleStories } from "@/lib/sample-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const storyUrls = sampleStories.map((story) => ({
    url: `${baseUrl}/stories/${story.slug}`,
    lastModified: new Date(story.updatedAt),
  }));

  return [{ url: baseUrl, lastModified: new Date() }, ...storyUrls];
}
