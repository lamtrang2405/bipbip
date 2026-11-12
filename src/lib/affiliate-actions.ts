"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_CTA_LABEL,
  PLACEMENT_FIELDS,
  PLACEMENT_KEYS,
  UUID_RE,
  type PlacementField,
} from "@/lib/affiliate-config";
import { assertAllowedAffiliateUrl } from "@/lib/affiliate-url";
import { isStoredCoverUrl, saveCoverImage } from "@/lib/covers";
import { isSchemaMissingError } from "@/lib/repository-supabase";
import { slugify } from "@/lib/slugify";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const uuid = z.string().regex(UUID_RE);
const localDateTime = z.union([z.literal(""), z.string().regex(LOCAL_DATETIME_RE)]);

const linkSchema = z.object({
  id: z.union([z.literal(""), uuid]),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500),
  targetUrl: z.string().trim().min(1).max(2000),
  ctaLabel: z.string().trim().max(60),
  imageUrl: z.string().trim().max(2000),
  placements: z.array(z.enum(PLACEMENT_KEYS)).max(PLACEMENT_KEYS.length),
  weight: z.coerce.number().int().min(1).max(100),
  categoryIds: z.array(uuid).max(200),
  storySlugs: z.string().max(10000),
  startsAt: localDateTime,
  endsAt: localDateTime,
  isActive: z.boolean(),
});

const placementKeySchema = z.enum(PLACEMENT_KEYS);

function requireService() {
  const service = getSupabaseServiceRoleClient();
  if (!service) redirect("/admin/affiliate?error=schema");
  return service;
}

function done(query: string, anchor: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin/affiliate?${query}#${anchor}`);
}

function fail(error: { code?: string; message?: string }, anchor: string): never {
  if (isSchemaMissingError(error)) redirect(`/admin/affiliate?error=schema#${anchor}`);
  throw new Error(error.message);
}

/** Giờ nhập trong admin hiểu là giờ Việt Nam (UTC+7, không có giờ mùa hè). */
function vnLocalToIso(value: string) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : null;
}

export async function savePlacementAction(formData: FormData) {
  await requireAdmin();
  const key = placementKeySchema.safeParse(formData.get("key"));
  if (!key.success) done("error=invalid", "placements");

  const fields = PLACEMENT_FIELDS[key.data] as readonly PlacementField[];
  const configSchema = z.object(
    Object.fromEntries(fields.map((field) => [field.name, z.coerce.number().min(field.min).max(field.max)])),
  );
  const config = configSchema.safeParse(Object.fromEntries(fields.map((field) => [field.name, formData.get(field.name)])));
  if (!config.success) done(`error=config&key=${key.data}`, "placements");

  const { error } = await requireService()
    .from("affiliate_placements")
    .upsert(
      {
        key: key.data,
        is_enabled: formData.get("isEnabled") === "on",
        config: config.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  if (error) fail(error, "placements");
  done(`saved=placement&key=${key.data}`, "placements");
}

type ImageChange = { kind: "none" } | { kind: "set"; url: string | null } | { kind: "error" };

async function resolveImage(formData: FormData, title: string): Promise<ImageChange> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const url = await saveCoverImage(file, `affiliate/${slugify(title).slice(0, 40) || "link"}`);
    return url ? { kind: "set", url } : { kind: "error" };
  }
  const link = String(formData.get("imageUrl") ?? "").trim();
  if (link) {
    if (isStoredCoverUrl(link)) return { kind: "set", url: link };
    try {
      const url = new URL(link);
      if (url.protocol !== "https:" || url.username || url.password) return { kind: "error" };
      return { kind: "set", url: url.toString() };
    } catch {
      return { kind: "error" };
    }
  }
  return formData.get("removeImage") === "on" ? { kind: "set", url: null } : { kind: "none" };
}

function parseSlugs(raw: string) {
  return [...new Set(raw.split(/[\s,;]+/).map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
}

export async function saveAffiliateLinkAction(formData: FormData) {
  await requireAdmin();
  const parsed = linkSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    targetUrl: String(formData.get("targetUrl") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    placements: formData.getAll("placements").map(String),
    weight: formData.get("weight") ?? 10,
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
    storySlugs: String(formData.get("storySlugs") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    isActive: formData.get("isActive") === "on",
  });
  const rawId = String(formData.get("id") ?? "");
  const editQuery = UUID_RE.test(rawId) ? `&edit=${rawId}` : "";
  if (!parsed.success) done(`error=invalid${editQuery}`, "form");
  const input = parsed.data;

  let targetUrl: string;
  try {
    targetUrl = assertAllowedAffiliateUrl(input.targetUrl);
  } catch {
    done(`error=url${editQuery}`, "form");
  }

  const startsAt = vnLocalToIso(input.startsAt);
  const endsAt = vnLocalToIso(input.endsAt);
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) done(`error=schedule${editQuery}`, "form");

  const service = requireService();
  const slugs = parseSlugs(input.storySlugs);
  let storyIds: string[] = [];
  if (slugs.length) {
    const { data, error } = await service.from("stories").select("id, slug").in("slug", slugs);
    if (error) fail(error, "form");
    const found = (data ?? []) as { id: string; slug: string }[];
    const missing = slugs.filter((slug) => !found.some((row) => row.slug === slug));
    if (missing.length) done(`error=story&missing=${encodeURIComponent(missing.slice(0, 5).join(", "))}${editQuery}`, "form");
    storyIds = found.map((row) => row.id);
  }

  const image = await resolveImage(formData, input.title);
  if (image.kind === "error") done(`error=image${editQuery}`, "form");

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    title: input.title,
    description: input.description || null,
    target_url: targetUrl,
    cta_label: input.ctaLabel || DEFAULT_CTA_LABEL,
    placements: input.placements,
    weight: input.weight,
    story_ids: storyIds,
    category_ids: input.categoryIds,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: input.isActive,
    updated_at: now,
  };
  if (image.kind === "set") row.image_url = image.url;

  if (input.id) {
    const { error, count } = await service.from("affiliate_links").update(row, { count: "exact" }).eq("id", input.id);
    if (error) fail(error, "form");
    if (!count) done("error=not_found", "links");
  } else {
    const { error } = await service.from("affiliate_links").insert(row);
    if (error) fail(error, "form");
  }
  done("saved=link", "links");
}

export async function toggleAffiliateLinkAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) done("error=invalid", "links");
  const { error } = await requireService()
    .from("affiliate_links")
    .update({ is_active: formData.get("value") === "1", updated_at: new Date().toISOString() })
    .eq("id", id.data);
  if (error) fail(error, "links");
  done("saved=link", "links");
}

export async function deleteAffiliateLinkAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) done("error=invalid", "links");
  const { error, count } = await requireService().from("affiliate_links").delete({ count: "exact" }).eq("id", id.data);
  if (error) fail(error, "links");
  done(count ? "deleted=link" : "error=not_found", "links");
}
