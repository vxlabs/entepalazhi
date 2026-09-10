"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anon-key client for the browser, used only to PUT to a signed upload URL
 * (supabase.storage.uploadToSignedUrl) - the signed URL's own token is
 * what authorizes that specific upload, not this client's key. No auth
 * session, no cookies: this is not the admin auth client (see
 * lib/supabase/auth-server.ts for that).
 */
export function createBrowserClient() {
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
