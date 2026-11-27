import { notFound, redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

type Props = { params: Promise<{ path: string[] }> };

/**
 * Catches every unprefixed path (/issues, /about, /issues/area/x,
 * /issues/slug, ...) with a single rule rather than hand-mirroring each
 * route under app/[locale] - one redirect that stays correct as routes are
 * added later. /admin and /api are literal top-level segments, which Next
 * matches ahead of this catch-all, so neither is swallowed by it.
 */
export default async function BareCatchAll({ params }: Props) {
  const { path } = await params;
  // Already locale-prefixed (/en/no-such-page): nothing under [locale]
  // matched, so it does not exist. Redirecting again would loop (/en/en/...).
  if (isLocale(path[0])) notFound();
  redirect(`/${DEFAULT_LOCALE}/${path.join("/")}`);
}
