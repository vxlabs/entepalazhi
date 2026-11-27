import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * A third "root layout" (alongside app/[locale] and app/admin - see the
 * multiple-root-layouts pattern in Next's route-groups docs), existing
 * only to give an unprefixed path (/issues, /about, ...) somewhere to
 * redirect from.
 *
 * This replaces an earlier proxy.ts-based redirect: with
 * experimental.globalNotFound on, an unmatched route is served as a
 * precomputed static fallback that bypasses proxy/middleware entirely
 * (confirmed empirically - every bare path but "/" returned the identical
 * cached global-not-found response instead of reaching the redirect).
 * Making these real, matchable routes sidesteps that bypass altogether.
 */
export default function BareRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>{children}</body>
    </html>
  );
}
