"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  updateTaxonomyItem,
  type TaxonomyInput,
  type TaxonomyKind,
} from "@/lib/taxonomy";

function parseKind(formData: FormData): TaxonomyKind {
  return formData.get("kind") === "categories" ? "categories" : "tags";
}

function parseInput(formData: FormData): TaxonomyInput {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isVisible: formData.get("isVisible") === "on",
  };
}

function done(kind: TaxonomyKind, query: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin/taxonomy?${query}#${kind}`);
}

export async function createTaxonomyAction(formData: FormData) {
  await requireAdmin();
  const kind = parseKind(formData);
  const result = await createTaxonomyItem(kind, parseInput(formData));
  done(kind, result.ok ? `saved=${kind}` : `error=${result.reason}&kind=${kind}`);
}

export async function updateTaxonomyAction(formData: FormData) {
  await requireAdmin();
  const kind = parseKind(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) done(kind, `error=invalid&kind=${kind}`);
  const result = await updateTaxonomyItem(kind, id, parseInput(formData));
  done(kind, result.ok ? `saved=${kind}` : `error=${result.reason}&kind=${kind}`);
}

export async function deleteTaxonomyAction(formData: FormData) {
  await requireAdmin();
  const kind = parseKind(formData);
  const id = String(formData.get("id") ?? "");
  const ok = id ? await deleteTaxonomyItem(kind, id) : false;
  done(kind, ok ? `deleted=${kind}` : `error=delete&kind=${kind}`);
}
