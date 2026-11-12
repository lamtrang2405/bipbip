import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { COVERS_STORAGE_BUCKET, isSupabaseCmsEnabled } from "@/lib/supabase/cms-config";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_COVER_BYTES = 5 * 1024 * 1024;

/** Nhận diện định dạng theo byte đầu file, không tin `Content-Type` do client khai. */
function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

/** `declaredType`: loại file trình duyệt khai (chỉ có khi upload trực tiếp), phải là ảnh được hỗ trợ. */
async function storeCover(buffer: Buffer, storySlug: string, declaredType?: string): Promise<string | null> {
  const contentType = sniffImageType(buffer);
  const ext = contentType ? EXT_BY_TYPE[contentType] : undefined;
  if (!contentType || !ext || buffer.length > MAX_COVER_BYTES) return null;
  if (declaredType !== undefined && !EXT_BY_TYPE[declaredType]) return null;
  const fileName = `${storySlug}-${Date.now()}.${ext}`;

  if (isSupabaseCmsEnabled()) {
    const service = getSupabaseServiceRoleClient();
    if (!service) return null;
    const { error } = await service.storage.from(COVERS_STORAGE_BUCKET).upload(fileName, buffer, {
      contentType,
      upsert: false,
    });
    if (error) return null;
    return service.storage.from(COVERS_STORAGE_BUCKET).getPublicUrl(fileName).data.publicUrl;
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", "covers");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), buffer);
  return `/uploads/covers/${fileName}`;
}

export async function saveCoverImage(file: FormDataEntryValue | null, storySlug: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  return storeCover(Buffer.from(await file.arrayBuffer()), storySlug, file.type);
}

/** Link chia sẻ Google Drive (`/file/d/{id}/view`, `open?id=`) -> link tải trực tiếp. */
export function toDirectImageUrl(raw: string) {
  const url = new URL(raw);
  if (url.hostname === "drive.google.com") {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url.toString();
}

export function isStoredCoverUrl(url: string) {
  if (url.startsWith("/uploads/covers/")) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return Boolean(base && url.startsWith(`${base}/storage/v1/object/public/${COVERS_STORAGE_BUCKET}/`));
}

/** Tải ảnh từ URL ngoài và lưu vào kho ảnh bìa. Trả về `null` nếu không tải được. */
export async function rehostCoverFromUrl(rawUrl: string, storySlug: string): Promise<string | null> {
  let target: string;
  try {
    target = toDirectImageUrl(rawUrl.trim());
  } catch {
    return null;
  }
  if (!/^https?:\/\//i.test(target)) return null;

  try {
    const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const declaredSize = Number(res.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_COVER_BYTES) return null;
    return storeCover(Buffer.from(await res.arrayBuffer()), storySlug);
  } catch {
    return null;
  }
}
