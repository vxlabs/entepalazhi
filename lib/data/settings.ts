import "server-only";
import { unstable_cache } from "next/cache";
import { queryOne } from "@/lib/db";
import type { SiteSettings } from "@/lib/types";

async function fetchSiteSettings(): Promise<SiteSettings> {
  const row = await queryOne<SiteSettings>("select * from site_settings where id = 1");
  if (!row) throw new Error("site_settings row is missing - run the migrations.");
  return row;
}

/**
 * The single site_settings row. Nothing in it is private: it is copy for
 * the /support page plus the public social link. Used by the header and
 * footer, /support, and the sitemap.
 *
 * Cached because it is read on nearly every page and changes rarely.
 * actions/admin/settings.ts clears the "site-settings" tag on save so a
 * change is live at once; the 60s window here is only a safety net.
 */
export const getSiteSettings = unstable_cache(fetchSiteSettings, ["site-settings"], {
  revalidate: 60,
  tags: ["site-settings"],
});
