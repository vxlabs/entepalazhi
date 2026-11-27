import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { SITE_CONFIG } from "@/lib/site-config";

export function SiteFooter({
  locale,
  supportEnabled,
  instagramUrl,
}: {
  locale: Locale;
  supportEnabled: boolean;
  /** From /admin/settings; falls back to the default account in site-config. */
  instagramUrl: string | null;
}) {
  const dict = getDictionary(locale);
  const instagram = instagramUrl || SITE_CONFIG.instagramUrl;

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:px-6">
        <p className="max-w-prose text-muted-foreground">{dict.footer.rights}</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/${locale}/about`} className="hover:underline">
            {dict.footer.about}
          </Link>
          <Link href={`/${locale}/report`} className="hover:underline">
            {dict.footer.report}
          </Link>
          {supportEnabled && (
            <Link href={`/${locale}/support`} className="hover:underline">
              {dict.footer.support}
            </Link>
          )}
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {dict.footer.instagram}
            </a>
          )}
          {SITE_CONFIG.youtubeUrl && (
            <a href={SITE_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {dict.footer.youtube}
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
