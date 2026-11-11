/**
 * Đẩy dữ liệu từ data/stories.json lên Supabase (service role).
 * Chạy: npm run migrate:supabase
 * Cần .env.local với NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toUuidPrefixed(id, prefix) {
  const re = new RegExp(`^${prefix}-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`, "i");
  const m = id.match(re);
  return m ? m[1] : null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const raw = await readFile(path.join(root, "data", "stories.json"), "utf8");
  const stories = JSON.parse(raw);
  if (!Array.isArray(stories)) {
    console.error("stories.json không phải mảng.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const story of stories) {
    const storyUuid = toUuidPrefixed(story.id, "story") ?? globalThis.crypto.randomUUID();
    const { data: existing } = await supabase.from("stories").select("id").eq("slug", story.slug).maybeSingle();
    if (existing) {
      console.warn(`Bỏ qua (slug đã tồn tại): ${story.slug}`);
      continue;
    }

    const { error: insStory } = await supabase.from("stories").insert({
      id: storyUuid,
      title: story.title,
      slug: story.slug,
      summary: story.summary ?? "",
      cover_url: story.coverUrl ?? null,
      status: story.status === "published" ? "published" : "draft",
      is_featured: Boolean(story.isFeatured),
      published_at: story.publishedAt ?? null,
      created_at: story.createdAt ?? new Date().toISOString(),
      updated_at: story.updatedAt ?? new Date().toISOString(),
      author: story.author ?? null,
      category: story.category ?? null,
      completion_status: story.completionStatus ?? "ongoing",
      total_chapters_planned: story.totalChaptersPlanned ?? null,
    });

    if (insStory) {
      console.error(`Lỗi insert story ${story.slug}:`, insStory.message);
      continue;
    }

    for (const tag of story.tags ?? []) {
      const trimmed = String(tag?.name ?? "").replace(/^[\s|]+|[\s|]+$/g, "");
      if (!trimmed) continue;
      const tslug = slugify(trimmed);
      if (!tslug) continue;
      const { data: tagRow, error: tagErr } = await supabase
        .from("tags")
        .upsert({ name: trimmed, slug: tslug }, { onConflict: "slug" })
        .select("id")
        .single();
      if (tagErr) {
        console.error(`Tag ${tslug}:`, tagErr.message);
        continue;
      }
      const { error: linkErr } = await supabase
        .from("story_tags")
        .insert({ story_id: storyUuid, tag_id: tagRow.id });
      if (linkErr && !String(linkErr.message).toLowerCase().includes("duplicate")) {
        console.error(`story_tags:`, linkErr.message);
      }
    }

    for (const ch of story.chapters ?? []) {
      const chUuid = toUuidPrefixed(ch.id, "chapter") ?? globalThis.crypto.randomUUID();
      const { error: chErr } = await supabase.from("chapters").insert({
        id: chUuid,
        story_id: storyUuid,
        chapter_number: ch.chapterNumber,
        title: ch.title,
        slug: ch.slug,
        content: ch.content ?? "",
        is_published: Boolean(ch.isPublished),
        published_at: ch.publishedAt ?? null,
        created_at: ch.createdAt ?? new Date().toISOString(),
        updated_at: ch.updatedAt ?? new Date().toISOString(),
      });
      if (chErr) {
        console.error(`Lỗi chapter ${ch.slug}:`, chErr.message);
      }
    }

    console.log(`OK: ${story.slug}`);
  }

  console.log("Xong.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
