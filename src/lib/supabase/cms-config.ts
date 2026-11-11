/** CMS dùng Supabase khi đủ biến môi trường (đọc public + ghi admin qua service role). */
export function isSupabaseCmsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export const COVERS_STORAGE_BUCKET = "covers";
