/**
 * Non-secret site-wide constants. The social links are env-overridable so
 * they can be corrected at handover without a code change if the exact
 * YouTube handle/URL turns out to differ from this placeholder.
 */
export const SITE_CONFIG = {
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/mallu_boys88/",
  instagramHandle: "@mallu_boys88",
  youtubeUrl: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@mallu_boys88",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
