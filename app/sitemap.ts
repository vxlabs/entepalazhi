import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/config";
import { KERALA_DISTRICTS } from "@/lib/kerala";
import { getAllPublishedSlugs } from "@/lib/data/projects";
import { getSiteSettings } from "@/lib/data/settings";
import { SITE_CONFIG } from "@/lib/site-config";

/** DB-driven, both locales, published projects only - see the Phase 1 plan.
 * /support is only listed while support_enabled - see that page's
 * notFound() call and the Phase 2 plan's "not merely hidden with CSS". */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.siteUrl;
  const [slugs, settings] = await Promise.all([getAllPublishedSlugs(), getSiteSettings()]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    entries.push(
      { url: `${base}/${locale}`, changeFrequency: "daily", priority: 1 },
      { url: `${base}/${locale}/projects`, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/${locale}/about`, changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/${locale}/report`, changeFrequency: "monthly", priority: 0.5 },
    );
    if (settings.support_enabled) {
      entries.push({ url: `${base}/${locale}/support`, changeFrequency: "monthly", priority: 0.3 });
    }
    for (const district of KERALA_DISTRICTS) {
      entries.push({
        url: `${base}/${locale}/projects/district/${district.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const slug of slugs) {
      entries.push({
        url: `${base}/${locale}/projects/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
