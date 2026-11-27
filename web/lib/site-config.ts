/**
 * The brand in one place: names, domain, social account. Not secret, safe
 * to import anywhere. Page copy lives in lib/i18n/dict.ts; colours in
 * app/globals.css.
 */
export const SITE_CONFIG = {
  name: { en: "Ente Palazhi", ml: "എന്റെ പാലാഴി" },
  /** Shown on the admin screens, which are English-only. */
  adminName: "Ente Palazhi",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://entepalazhi.in",
  /** Default Instagram link; can be changed without a deploy from
   * /admin/settings (site_settings.instagram_url wins when set). */
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/ente_palazhi/",
  instagramHandle: "@ente_palazhi",
  /** No YouTube channel yet: the footer link appears only when this is set. */
  youtubeUrl: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
};
