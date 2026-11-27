import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { alternateLanguages, DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, t, tCount } from "@/lib/i18n/dict";
import { getDistrict, KERALA_DISTRICTS } from "@/lib/kerala";
import { getProjectsByDistrict } from "@/lib/data/projects";

export const revalidate = 3600;
export const dynamicParams = false; // only the 14 real districts are valid

type Props = {
  params: Promise<{ locale: string; district: string }>;
};

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    KERALA_DISTRICTS.map((d) => ({ locale, district: d.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, district: districtSlug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const district = getDistrict(districtSlug);
  if (!district) return {};
  const name = locale === "ml" ? district.ml : district.en;
  const pathname = `/${locale}/projects/district/${districtSlug}`;

  return {
    title: `${dict.projects.title} ${t(dict.projects.in_district, { district: name })}`,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

export default async function DistrictPage({ params }: Props) {
  const { locale: rawLocale, district: districtSlug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const district = getDistrict(districtSlug);
  if (!district) notFound();

  const projects = await getProjectsByDistrict(districtSlug);
  const name = locale === "ml" ? district.ml : district.en;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">
        {dict.projects.title} {t(dict.projects.in_district, { district: name })}
      </h1>
      <p className="text-sm text-muted-foreground">{tCount(dict, projects.length)}</p>
      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {dict.projects.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
