import { MEOKAMMAP_THE_LOAI } from "@/lib/meokammap-genres";
import { isSchemaMissingError } from "@/lib/repository-supabase";
import { slugify } from "@/lib/slugify";
import { isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { TaxonomyItem } from "@/types/story";

export type TaxonomyKind = "tags" | "categories";

export const TAXONOMY_LABELS: Record<TaxonomyKind, string> = {
  tags: "Thể loại",
  categories: "Danh mục",
};

export const MIGRATION_HINT =
  "Cần chạy migration supabase/migrations/20261111_cms_taxonomy.sql trên Supabase (SQL Editor).";

type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  story_tags?: { count: number }[];
  stories?: { count: number }[];
};

function mapRow(row: TaxonomyRow): TaxonomyItem {
  const counts = row.story_tags ?? row.stories ?? [];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    storyCount: counts[0]?.count ?? 0,
  };
}

function requireService() {
  const service = getSupabaseServiceRoleClient();
  if (!service) throw new Error("Supabase service client không khả dụng");
  return service;
}

export type TaxonomyList = { items: TaxonomyItem[]; schemaReady: boolean };

export async function listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyList> {
  if (!isSupabaseCmsEnabled()) return { items: [], schemaReady: false };
  const service = requireService();
  const countRelation = kind === "tags" ? "story_tags(count)" : "stories(count)";
  const { data, error } = await service
    .from(kind)
    .select(`id, name, slug, description, sort_order, is_visible, ${countRelation}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error && isSchemaMissingError(error)) {
    if (kind === "categories") return { items: [], schemaReady: false };
    const legacy = await service.from("tags").select("id, name, slug, story_tags(count)").order("name");
    if (legacy.error) throw new Error(legacy.error.message);
    const items = (legacy.data ?? []).map((row) =>
      mapRow({ ...(row as Omit<TaxonomyRow, "description" | "sort_order" | "is_visible">), description: null, sort_order: 0, is_visible: true }),
    );
    return { items, schemaReady: false };
  }
  if (error) throw new Error(error.message);
  return { items: ((data ?? []) as unknown as TaxonomyRow[]).map(mapRow), schemaReady: true };
}

/** Thể loại hiển thị trên menu public. Chưa có migration thì dùng danh sách tĩnh. */
export async function listVisibleTagNames(): Promise<string[]> {
  const fallback = [...MEOKAMMAP_THE_LOAI];
  if (!isSupabaseCmsEnabled()) return fallback;
  const client = await getSupabaseServerClient();
  if (!client) return fallback;
  const { data, error } = await client
    .from("tags")
    .select("name")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return fallback;
  return (data ?? []).map((row) => (row as { name: string }).name);
}

export async function listVisibleCategoryNames(): Promise<string[] | null> {
  if (!isSupabaseCmsEnabled()) return null;
  const client = await getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from("categories")
    .select("name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return null;
  return (data ?? []).map((row) => (row as { name: string }).name);
}

export async function isTaxonomySchemaReady(): Promise<boolean> {
  if (!isSupabaseCmsEnabled()) return false;
  const { error } = await requireService().from("categories").select("id").limit(1);
  if (error && isSchemaMissingError(error)) return false;
  if (error) throw new Error(error.message);
  return true;
}

export type TaxonomyInput = {
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
};

export type TaxonomyWriteResult = { ok: true; id: string } | { ok: false; reason: "invalid" | "slug_taken" };

function toRow(input: TaxonomyInput) {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  return {
    name,
    slug,
    description: input.description?.trim() || null,
    sort_order: Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder as number) : 0,
    is_visible: input.isVisible ?? true,
  };
}

async function isSlugTaken(kind: TaxonomyKind, slug: string, exceptId?: string) {
  const service = requireService();
  let query = service.from(kind).select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

export async function createTaxonomyItem(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyWriteResult> {
  const row = toRow(input);
  if (!row.name || !row.slug) return { ok: false, reason: "invalid" };
  if (await isSlugTaken(kind, row.slug)) return { ok: false, reason: "slug_taken" };
  const { data, error } = await requireService().from(kind).insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateTaxonomyItem(
  kind: TaxonomyKind,
  id: string,
  input: TaxonomyInput,
): Promise<TaxonomyWriteResult> {
  const row = toRow(input);
  if (!row.name || !row.slug) return { ok: false, reason: "invalid" };
  if (await isSlugTaken(kind, row.slug, id)) return { ok: false, reason: "slug_taken" };
  const { error } = await requireService().from(kind).update(row).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true, id };
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, id: string): Promise<boolean> {
  const { error, count } = await requireService().from(kind).delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** Tìm danh mục theo tên/slug, tạo mới nếu chưa có. */
export async function ensureCategory(name: string): Promise<{ id: string; created: boolean } | null> {
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  if (!trimmed || !slug) return null;
  const service = requireService();
  const { data: existing, error } = await service.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return { id: (existing as { id: string }).id, created: false };
  const result = await createTaxonomyItem("categories", { name: trimmed, slug });
  return result.ok ? { id: result.id, created: true } : null;
}
