import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for every Phase 2 write path (submissions, admin
 * mutations, storage moderation, the seen-confirmation RPC).
 *
 * `import "server-only"` fails the build if this module is ever pulled
 * into a Client Component bundle - the service-role key must never reach
 * the browser. RLS grants anon/authenticated no write access anywhere in
 * 0002_admin.sql specifically so this client (bypassing RLS entirely) is
 * the only way data changes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
