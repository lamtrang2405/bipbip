import { cache } from "react";
import {
  AffiliateClientConfig,
  AffiliateOffer,
  DEFAULT_CTA_LABEL,
  isPlacementKey,
  normalizePlacementConfig,
  PLACEMENT_KEYS,
  PlacementKey,
  UUID_RE,
} from "@/lib/affiliate-config";
import { isSchemaMissingError } from "@/lib/repository-supabase";
import { getSupabasePublicClient } from "@/lib/supabase/server";

/** Chỉ dùng phía server (Server Component). Client chỉ nhận `AffiliateOffer`, không có `target_url`. */

type LinkRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  weight: number;
  placements: string[] | null;
  story_ids: string[] | null;
  category_ids: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

type PlacementRow = { key: string; is_enabled: boolean; config: unknown };

type AffiliateData = {
  placements: Map<PlacementKey, unknown>;
  links: LinkRow[];
};

const EMPTY: AffiliateData = { placements: new Map(), links: [] };

function logUnexpected(scope: string, error: { code?: string; message?: string } | null) {
  if (error && !isSchemaMissingError(error)) console.warn(`[affiliate] ${scope}: ${error.message}`);
}

function isLive(link: LinkRow, now: number) {
  if (!link.is_active) return false;
  if (link.starts_at && Date.parse(link.starts_at) > now) return false;
  if (link.ends_at && Date.parse(link.ends_at) <= now) return false;
  return true;
}

/** Placement đang bật + link đang chạy (RLS đã lọc active/lịch, lọc lại để chắc chắn). */
export const getAffiliateConfig = cache(async (): Promise<AffiliateData> => {
  const client = getSupabasePublicClient();
  if (!client) return EMPTY;
  try {
    const placementsRes = await client.from("affiliate_placements").select("key, is_enabled, config").eq("is_enabled", true);
    if (placementsRes.error) {
      logUnexpected("placements", placementsRes.error);
      return EMPTY;
    }
    const placements = new Map<PlacementKey, unknown>();
    for (const row of (placementsRes.data ?? []) as PlacementRow[]) {
      if (isPlacementKey(row.key) && row.is_enabled) placements.set(row.key, row.config);
    }
    if (!placements.size) return EMPTY;

    const linksRes = await client
      .from("affiliate_links")
      .select("id, title, description, image_url, cta_label, weight, placements, story_ids, category_ids, starts_at, ends_at, is_active")
      .eq("is_active", true)
      .limit(500);
    if (linksRes.error) {
      logUnexpected("links", linksRes.error);
      return EMPTY;
    }
    const now = Date.now();
    return { placements, links: ((linksRes.data ?? []) as LinkRow[]).filter((link) => isLive(link, now)) };
  } catch (error) {
    console.warn("[affiliate] load failed:", error instanceof Error ? error.message : error);
    return EMPTY;
  }
});

const getStoryCategoryId = cache(async (storyId: string): Promise<string | null> => {
  const client = getSupabasePublicClient();
  if (!client || !UUID_RE.test(storyId)) return null;
  try {
    const { data, error } = await client.from("stories").select("category_id").eq("id", storyId).maybeSingle();
    if (error) return null;
    return (data as { category_id: string | null } | null)?.category_id ?? null;
  } catch {
    return null;
  }
});

function toOffer(link: LinkRow): AffiliateOffer {
  return {
    id: link.id,
    title: link.title,
    description: link.description,
    image_url: link.image_url,
    cta_label: link.cta_label?.trim() || DEFAULT_CTA_LABEL,
    weight: link.weight,
  };
}

/** 0 = nhắm đúng truyện, 1 = đúng danh mục, 2 = link chung, null = nhắm nơi khác. */
function matchTier(link: LinkRow, storyId: string | null, categoryId: string | null): number | null {
  const stories = link.story_ids ?? [];
  const categories = link.category_ids ?? [];
  if (storyId && stories.includes(storyId)) return 0;
  if (categoryId && categories.includes(categoryId)) return 1;
  if (!stories.length && !categories.length) return 2;
  return null;
}

/** Cấu hình affiliate cho một truyện: mỗi placement chỉ giữ nhóm link khớp tốt nhất. */
export async function getAffiliateForStory(storyId: string | null): Promise<AffiliateClientConfig> {
  const data = await getAffiliateConfig();
  if (!data.placements.size || !data.links.length) return {};

  const needsCategory = data.links.some((link) => (link.category_ids ?? []).length > 0);
  const categoryId = storyId && needsCategory ? await getStoryCategoryId(storyId) : null;

  const out: AffiliateClientConfig = {};
  for (const key of PLACEMENT_KEYS) {
    if (!data.placements.has(key)) continue;
    let bestTier = Infinity;
    let best: LinkRow[] = [];
    for (const link of data.links) {
      if (!(link.placements ?? []).includes(key)) continue;
      const tier = matchTier(link, storyId, categoryId);
      if (tier === null || tier > bestTier) continue;
      if (tier < bestTier) {
        bestTier = tier;
        best = [];
      }
      best.push(link);
    }
    if (!best.length) continue;
    const entry = { config: normalizePlacementConfig(key, data.placements.get(key)), offers: best.map(toOffer) };
    (out as Record<PlacementKey, unknown>)[key] = entry;
  }
  return out;
}
