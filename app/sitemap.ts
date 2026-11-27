import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/config";
import { PALAZHI_AREAS } from "@/lib/areas";
import { getAllPublishedSlugs } from "@/lib/data/projects";
import { getSiteSettings } from "@/lib/data/settings";
import { SITE_CONFIG } from "@/lib/site-config";

// Reads the database, so it is generated on request, not at build time.
export const dynamic = "force-dynamic";

/** Both locales, published issues only. /support is listed only while it
 * is switched on in /admin/settings. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.siteUrl;
  const [slugs, settings] = await Promise.all([getAllPublishedSlugs(), getSiteSettings()]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    entries.push(
      { url: `${base}/${locale}`, changeFrequency: "daily", priority: 1 },
      { url: `${base}/${locale}/issues`, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/${locale}/about`, changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/${locale}/report`, changeFrequency: "monthly", priority: 0.5 },
    );
    if (settings.support_enabled) {
      entries.push({ url: `${base}/${locale}/support`, changeFrequency: "monthly", priority: 0.3 });
    }
    for (const area of PALAZHI_AREAS) {
      entries.push({
        url: `${base}/${locale}/issues/area/${area.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const slug of slugs) {
      entries.push({
        url: `${base}/${locale}/issues/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
