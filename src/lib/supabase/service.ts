import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let didResolve = false;

/** Client service role — chỉ dùng trong Server Actions / Route Handlers, không import vào client bundle. */
export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  if (didResolve) return cached;
  didResolve = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
