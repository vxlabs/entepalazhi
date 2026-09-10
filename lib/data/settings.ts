import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

async function fetchSiteSettings(): Promise<SiteSettings> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data as SiteSettings;
}

/**
 * Reads the single site_settings row via the anon client - see
 * supabase/migrations/0002_admin.sql's site_settings_public_read policy.
 * Used by the header/footer support link, /support, and the sitemap.
 *
 * Cached like getStatsSummary in lib/data/projects.ts (same rationale:
 * read on nearly every page, changes rarely). actions/admin/settings.ts
 * calls revalidateTag("site-settings") on save for the "live without a
 * redeploy" requirement; the 60s window here is just a safety net.
 */
export const getSiteSettings = unstable_cache(fetchSiteSettings, ["site-settings"], {
  revalidate: 60,
  tags: ["site-settings"],
});
