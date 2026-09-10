/**
 * The 14 districts of Kerala. This is a fixed list rather than a database
 * table so it can be imported into both server code (filters, CHECK
 * constraint reference) and client components (dropdowns) with zero
 * round-trips, and enforced in Postgres via CHECK (district IN (...)) — see
 * supabase/migrations/0001_core.sql.
 */
export type District = {
  slug: string;
  en: string;
  ml: string;
};

export const KERALA_DISTRICTS: District[] = [
  { slug: "thiruvananthapuram", en: "Thiruvananthapuram", ml: "തിരുവനന്തപുരം" },
  { slug: "kollam", en: "Kollam", ml: "കൊല്ലം" },
  { slug: "pathanamthitta", en: "Pathanamthitta", ml: "പത്തനംതിട്ട" },
  { slug: "alappuzha", en: "Alappuzha", ml: "ആലപ്പുഴ" },
  { slug: "kottayam", en: "Kottayam", ml: "കോട്ടയം" },
  { slug: "idukki", en: "Idukki", ml: "ഇടുക്കി" },
  { slug: "ernakulam", en: "Ernakulam", ml: "എറണാകുളം" },
  { slug: "thrissur", en: "Thrissur", ml: "തൃശ്ശൂർ" },
  { slug: "palakkad", en: "Palakkad", ml: "പാലക്കാട്" },
  { slug: "malappuram", en: "Malappuram", ml: "മലപ്പുറം" },
  { slug: "kozhikode", en: "Kozhikode", ml: "കോഴിക്കോട്" },
  { slug: "wayanad", en: "Wayanad", ml: "വയനാട്" },
  { slug: "kannur", en: "Kannur", ml: "കണ്ണൂർ" },
  { slug: "kasaragod", en: "Kasaragod", ml: "കാസർഗോഡ്" },
];

const BY_SLUG = new Map(KERALA_DISTRICTS.map((d) => [d.slug, d]));

export function getDistrict(slug: string): District | undefined {
  return BY_SLUG.get(slug);
}

export function isDistrictSlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}
