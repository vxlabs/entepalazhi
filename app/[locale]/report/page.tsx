import type { Metadata } from "next";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { ReportForm } from "@/components/report-form";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const pathname = `/${locale}/report`;
  return {
    title: dict.report.title,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{dict.report.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.report.intro}</p>
      <p className="mt-2 mb-6 text-sm font-medium">{dict.report.privacy}</p>
      <ReportForm locale={locale} dict={dict} />
    </div>
  );
}
