import type { Metadata } from "next";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { SITE_CONFIG } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/data/settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const pathname = `/${locale}/about`;
  return {
    title: dict.about.title,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  const instagram = settings.instagram_url || SITE_CONFIG.instagramUrl;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{dict.about.title}</h1>
      <p className="leading-relaxed">{dict.about.p1}</p>
      <p className="leading-relaxed">{dict.about.p2}</p>
      <p className="leading-relaxed">{dict.about.p3}</p>
      <p className="leading-relaxed">{dict.about.p4}</p>
      <p className="leading-relaxed">{dict.about.p5}</p>
      <div className="mt-4 flex gap-4 text-sm">
        {instagram && (
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {dict.footer.instagram} {SITE_CONFIG.instagramHandle}
          </a>
        )}
        {SITE_CONFIG.youtubeUrl && (
          <a href={SITE_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {dict.footer.youtube}
          </a>
        )}
      </div>
    </div>
  );
}
