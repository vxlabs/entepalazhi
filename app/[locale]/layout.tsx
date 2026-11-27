import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono, Noto_Sans_Malayalam } from "next/font/google";
import "../globals.css";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { SITE_CONFIG } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/data/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Malayalam script needs its own font: Geist has no Malayalam glyphs, so
// Malayalam text would otherwise fall back to whatever the OS ships (often
// a cramped or missing system font). Loaded on every page as a small
// display-swap font, not gated behind locale, so an English page that
// quotes a Malayalam-only project name still renders it correctly.
const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
});

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Any locale not returned by generateStaticParams (e.g. /fr/...) never
// reaches this layout's body - Next.js resolves it through
// app/global-not-found.tsx instead. This sidesteps calling notFound() from
// inside the root layout itself, which has no wrapping layout left to host
// a nested not-found.tsx boundary (this segment's layout IS the root - see
// next.config.ts's globalNotFound comment).
export const dynamicParams = false;

// Every public page reads from the database, so pages are rendered when
// requested rather than at build time: the build (and the Docker image)
// must not need a running database. The two reads that happen on nearly
// every page - site settings and the home page totals - are cached in
// lib/data (unstable_cache) and cleared by the admin actions on save.
export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_CONFIG.siteUrl),
    title: { default: dict.site.name, template: `%s | ${dict.site.name}` },
    description: dict.site.tagline,
  };
}

/**
 * This IS the app's root layout (it renders <html>/<body>), nested under
 * the [locale] dynamic segment rather than at app/layout.tsx - the pattern
 * Next.js documents for i18n root layouts. app/admin is a
 * separate root layout of its own; see next.config.ts's
 * experimental.globalNotFound for why that split needs a global 404.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  // A single unprefixed segment (/issues, /about) matches [locale] ahead of
  // app/(bare-redirects)/[...path], and with force-dynamic, dynamicParams =
  // false does not stop it reaching here in production. Treat it as a bare
  // path: /issues -> /ml/issues (an unknown one, e.g. /fr, then 404s there).
  if (!isLocale(rawLocale)) redirect(`/${DEFAULT_LOCALE}/${encodeURIComponent(rawLocale)}`);
  const locale: Locale = rawLocale;
  // support_enabled gates the nav/footer link and /support itself (see
  // that page's notFound() call) - checked here, once, rather than in
  // each of header/footer/page, since it's the same read either way.
  const settings = await getSiteSettings();

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} ${notoMalayalam.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader locale={locale} supportEnabled={settings.support_enabled} />
        <main className="flex-1">{children}</main>
        <SiteFooter
          locale={locale}
          supportEnabled={settings.support_enabled}
          instagramUrl={settings.instagram_url}
        />
      </body>
    </html>
  );
}
