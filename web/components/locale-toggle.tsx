"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { localizePath, otherLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";

/**
 * A plain <Link> to the same path under the other locale - not a cookie-
 * backed toggle. Client Component only so it can read the live pathname via
 * usePathname(); layouts don't rerender on navigation and can't read it
 * themselves (see Next.js docs, layout.js "Query params" caveat), and
 * reading headers() server-side to get it would force every page in
 * app/[locale] into dynamic rendering, defeating the static generation the
 * SEO plan depends on. This is the one small client island in the header.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const target = otherLocale(locale);
  return (
    <Link
      href={localizePath(pathname, target)}
      hrefLang={target}
      className="text-sm font-medium underline-offset-4 hover:underline"
    >
      {dict.nav.language}
    </Link>
  );
}
