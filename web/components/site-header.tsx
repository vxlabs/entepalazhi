import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { LocaleToggle } from "@/components/locale-toggle";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader({ locale, supportEnabled }: { locale: Locale; supportEnabled: boolean }) {
  const dict = getDictionary(locale);
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3 leading-tight">
          <BrandMark className="text-sm" />
          <span className="flex flex-col"><span className="text-lg font-black tracking-tight">{dict.site.name}</span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {dict.site.tagline}
          </span></span>
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href={`/${locale}/issues`} className="font-medium hover:underline">
            {dict.nav.projects}
          </Link>
          <Link href={`/${locale}#directory`} className="hidden font-medium hover:underline sm:inline">
            {dict.nav.directory}
          </Link>
          <Link href={`/${locale}/report`} className="hidden bg-board-500 px-3 py-2 font-bold text-black transition hover:bg-board-400 sm:inline">
            {dict.nav.report}
          </Link>
          <Link href={`/${locale}/about`} className="font-medium hover:underline">
            {dict.nav.about}
          </Link>
          {supportEnabled && (
            <Link href={`/${locale}/support`} className="hidden font-medium hover:underline sm:inline">
              {dict.footer.support}
            </Link>
          )}
          <LocaleToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
