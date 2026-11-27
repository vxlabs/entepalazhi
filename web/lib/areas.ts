/**
 * The parts of Palazhi the site is organised by.
 *
 * PLACEHOLDER LIST - edit to match how residents actually divide the
 * locality (wards, junctions, landmarks). It is a list in code rather than
 * a database table or constraint, so changing it needs no migration:
 *  - add or rename entries freely;
 *  - keep a slug stable once issues have been filed under it (the slug is
 *    what is stored in projects.area and used in /issues/area/<slug>);
 *  - keep "other" last as the catch-all.
 */
export type Area = {
  slug: string;
  en: string;
  ml: string;
};

export const PALAZHI_AREAS: Area[] = [
  { slug: "palazhi-junction", en: "Palazhi Junction", ml: "പാലാഴി ജംഗ്ഷൻ" },
  { slug: "hilite", en: "HiLite / Business Park", ml: "ഹൈലൈറ്റ് / ബിസിനസ് പാർക്ക്" },
  { slug: "mathara", en: "Mathara", ml: "മാത്തറ" },
  { slug: "kunnathupalam", en: "Kunnathupalam", ml: "കുന്നത്തുപാലം" },
  { slug: "other", en: "Elsewhere in Palazhi", ml: "പാലാഴിയിലെ മറ്റിടങ്ങൾ" },
];

export const DEFAULT_AREA = PALAZHI_AREAS[0].slug;

/** Pre-filled wherever a local body is asked for: almost every issue here
 * falls under the same one. */
export const DEFAULT_LOCAL_BODY = "Olavanna Grama Panchayat";

/** Map centre for the location picker (Palazhi, Kozhikode). */
export const PALAZHI_CENTER: [number, number] = [11.2455, 75.834];
export const PALAZHI_ZOOM = 15;

const BY_SLUG = new Map(PALAZHI_AREAS.map((a) => [a.slug, a]));

export function getArea(slug: string): Area | undefined {
  return BY_SLUG.get(slug);
}
