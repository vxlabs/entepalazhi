import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { FilterBar } from "@/components/filter-bar";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, tCount } from "@/lib/i18n/dict";
import { getDistinctDepartments, getFilteredProjects } from "@/lib/data/projects";
import type { ProjectListFilters, ProjectStatus } from "@/lib/types";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const VALID_STATUSES: ProjectStatus[] = [
  "lead",
  "reported",
  "acknowledged",
  "work_resumed",
  "completed",
  "no_action",
];
const VALID_SORTS: NonNullable<ProjectListFilters["sort"]>[] = [
  "newest",
  "days_desc",
  "cost_desc",
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveFilters(searchParams: Props["searchParams"]): Promise<ProjectListFilters> {
  const sp = await searchParams;
  const status = first(sp.status);
  const sort = first(sp.sort);
  return {
    area: first(sp.area),
    status: status && (VALID_STATUSES as string[]).includes(status) ? (status as ProjectStatus) : undefined,
    department: first(sp.department),
    q: first(sp.q),
    sort: sort && (VALID_SORTS as string[]).includes(sort) ? (sort as ProjectListFilters["sort"]) : undefined,
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const filters = await resolveFilters(searchParams);
  const hasFilters = Boolean(
    filters.area || filters.status || filters.department || filters.q || filters.sort,
  );
  const pathname = `/${locale}/issues`;

  return {
    title: dict.projects.title,
    description: dict.site.tagline,
    // Arbitrary filter/search/sort combinations are real, shareable pages,
    // but not ones worth Google's crawl budget - the area pages are
    // the indexable filter surface instead.
    robots: hasFilters ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: pathname,
      languages: hasFilters
        ? undefined
        : alternateLanguages(pathname),
    },
  };
}

export default async function ProjectsPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const filters = await resolveFilters(searchParams);

  const [projects, departments] = await Promise.all([
    getFilteredProjects(filters),
    getDistinctDepartments(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{dict.projects.title}</h1>
      <FilterBar locale={locale} dict={dict} departments={departments} />
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
