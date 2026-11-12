import {
  isPlacementKey,
  normalizePlacementConfig,
  PLACEMENT_KEYS,
  type PlacementKey,
} from "@/lib/affiliate-config";
import { isSchemaMissingError } from "@/lib/repository-supabase";
import { isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const AFFILIATE_MIGRATION_HINT =
  "Cần chạy migration supabase/migrations/20261114_affiliate.sql trên Supabase (SQL Editor) để dùng Affiliate.";

export type AdminPlacement = {
  key: PlacementKey;
  isEnabled: boolean;
  config: Record<string, number>;
  updatedAt: string | null;
};

export type AdminAffiliateLink = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string;
  ctaLabel: string;
  placements: PlacementKey[];
  weight: number;
  storyIds: string[];
  categoryIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LinkClickStats = { total: number; byPlacement: Partial<Record<PlacementKey, number>> };

export type AffiliateAdminData = {
  schemaReady: boolean;
  placements: AdminPlacement[];
  links: AdminAffiliateLink[];
  stats: Record<string, LinkClickStats>;
  statsReady: boolean;
  storySlugs: Record<string, string>;
};

type LinkRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string;
  cta_label: string;
  placements: string[] | null;
  weight: number;
  story_ids: string[] | null;
  category_ids: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function defaultPlacements(): AdminPlacement[] {
  return PLACEMENT_KEYS.map((key) => ({
    key,
    isEnabled: false,
    config: normalizePlacementConfig(key, {}),
    updatedAt: null,
  }));
}

function mapLink(row: LinkRow): AdminAffiliateLink {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    ctaLabel: row.cta_label,
    placements: (row.placements ?? []).filter(isPlacementKey),
    weight: row.weight,
    storyIds: row.story_ids ?? [],
    categoryIds: row.category_ids ?? [],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const NOT_READY: AffiliateAdminData = {
  schemaReady: false,
  placements: defaultPlacements(),
  links: [],
  stats: {},
  statsReady: false,
  storySlugs: {},
};

export async function getAffiliateAdminData(): Promise<AffiliateAdminData> {
  const service = isSupabaseCmsEnabled() ? getSupabaseServiceRoleClient() : null;
  if (!service) return NOT_READY;

  const [placementsRes, linksRes, statsRes] = await Promise.all([
    service.from("affiliate_placements").select("key, is_enabled, config, updated_at"),
    service.from("affiliate_links").select("*").order("created_at", { ascending: false }),
    service.from("affiliate_click_stats_7d").select("link_id, placement, clicks"),
  ]);
  if (placementsRes.error || linksRes.error) {
    const error = placementsRes.error ?? linksRes.error;
    if (isSchemaMissingError(error)) return NOT_READY;
    throw new Error(error?.message);
  }

  const rows = (placementsRes.data ?? []) as { key: string; is_enabled: boolean; config: unknown; updated_at: string }[];
  const placements = defaultPlacements().map((fallback) => {
    const row = rows.find((item) => item.key === fallback.key);
    return row
      ? { key: fallback.key, isEnabled: row.is_enabled, config: normalizePlacementConfig(fallback.key, row.config), updatedAt: row.updated_at }
      : fallback;
  });

  const links = ((linksRes.data ?? []) as LinkRow[]).map(mapLink);

  const stats: Record<string, LinkClickStats> = {};
  for (const row of (statsRes.data ?? []) as { link_id: string | null; placement: string | null; clicks: number }[]) {
    if (!row.link_id) continue;
    const entry = (stats[row.link_id] ??= { total: 0, byPlacement: {} });
    entry.total += row.clicks;
    if (isPlacementKey(row.placement)) entry.byPlacement[row.placement] = (entry.byPlacement[row.placement] ?? 0) + row.clicks;
  }

  const storyIds = [...new Set(links.flatMap((link) => link.storyIds))];
  const storySlugs: Record<string, string> = {};
  if (storyIds.length) {
    const { data } = await service.from("stories").select("id, slug").in("id", storyIds);
    for (const row of (data ?? []) as { id: string; slug: string }[]) storySlugs[row.id] = row.slug;
  }

  return { schemaReady: true, placements, links, stats, statsReady: !statsRes.error, storySlugs };
}
