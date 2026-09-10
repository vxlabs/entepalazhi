import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

type Props = { params: Promise<{ path: string[] }> };

/**
 * Catches every unprefixed path (/projects, /about, /projects/district/x,
 * /projects/slug, ...) with a single rule rather than hand-mirroring each
 * route under app/[locale] - one redirect that stays correct as routes are
 * added later. /admin and /api are literal top-level segments, which Next
 * matches ahead of this catch-all, so neither is swallowed by it.
 */
export default async function BareCatchAll({ params }: Props) {
  const { path } = await params;
  redirect(`/${DEFAULT_LOCALE}/${path.join("/")}`);
}
