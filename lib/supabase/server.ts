import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only anon client for public pages.
 *
 * Deliberately NOT using @supabase/ssr / cookies() here: Phase 1 has no
 * user session to read, and calling cookies() in a Server Component would
 * force that route into dynamic rendering, defeating the static
 * generation + ISR that the SEO plan depends on for detail and district
 * pages. RLS (anon = SELECT on published rows only, see
 * supabase/migrations/0001_core.sql) is what keeps this safe to call from
 * anywhere - there is no service-role key on this path.
 *
 * Phase 2 adds a separate cookie-aware client for admin auth.
 */
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
