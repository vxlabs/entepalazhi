export const LOCALES = ["en", "ml"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ml";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Build a same-page href under the other locale, e.g. "/ml/projects" <-> "/en/projects". */
export function localizePath(pathname: string, locale: Locale): string {
  const rest = pathname.replace(/^\/(en|ml)(?=\/|$)/, "") || "/";
  return `/${locale}${rest === "/" ? "" : rest}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ml" : "en";
}

/**
 * hreflang map for a locale-prefixed pathname. x-default points at
 * DEFAULT_LOCALE, which is the same page "/" and every unprefixed path
 * redirect to (see app/(bare-redirects)), so search engines send
 * locale-agnostic traffic to the same place the site itself does.
 */
export function alternateLanguages(pathname: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localizePath(pathname, l)])),
    "x-default": localizePath(pathname, DEFAULT_LOCALE),
  };
}
