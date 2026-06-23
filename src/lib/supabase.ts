import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Data API の URL (/rest/v1/) が入っていても動くよう正規化 */
export function normalizeSupabaseUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function hasSupabasePublicConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasSupabaseServiceConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createSupabaseAnonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(normalizeSupabaseUrl(url), key.trim());
}

export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(normalizeSupabaseUrl(url), key.trim());
}
