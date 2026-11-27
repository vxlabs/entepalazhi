import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, t, tCount } from "@/lib/i18n/dict";
import { getArea } from "@/lib/areas";
import { getProjectsByArea } from "@/lib/data/projects";


type Props = {
  params: Promise<{ locale: string; area: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, area: areaSlug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const area = getArea(areaSlug);
  if (!area) return {};
  const name = locale === "ml" ? area.ml : area.en;
  const pathname = `/${locale}/issues/area/${areaSlug}`;

  return {
    title: `${dict.projects.title} ${t(dict.projects.in_area, { area: name })}`,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { locale: rawLocale, area: areaSlug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const area = getArea(areaSlug);
  if (!area) notFound();

  const projects = await getProjectsByArea(areaSlug);
  const name = locale === "ml" ? area.ml : area.en;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">
        {dict.projects.title} {t(dict.projects.in_area, { area: name })}
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
