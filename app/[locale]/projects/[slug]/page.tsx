import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DayCounter } from "@/components/day-counter";
import { InstagramEmbed } from "@/components/instagram-embed";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { extractYouTubeId } from "@/lib/youtube";
import { ProjectMap } from "@/components/project-map";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { ShareButtons } from "@/components/share-buttons";
import { SeenButton } from "@/components/seen-button";
import { computeDayCounter, daysOverdue, formatDateIST } from "@/lib/dates";
import { formatCostINR } from "@/lib/format";
import { alternateLanguages, DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, t } from "@/lib/i18n/dict";
import { getDistrict } from "@/lib/kerala";
import { pick } from "@/lib/pick";
import { SITE_CONFIG } from "@/lib/site-config";
import { getPublicPhotoUrl } from "@/lib/storage";
import {
  getAllPublishedSlugs,
  getProjectBySlug,
  getProjectMedia,
  getProjectUpdates,
} from "@/lib/data/projects";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const name = pick(project, "name", locale);
  const description = pick(project, "description", locale);
  const pathname = `/${locale}/projects/${slug}`;

  return {
    title: name,
    description: description || undefined,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
    openGraph: { title: name, description: description || undefined },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [updates, media] = await Promise.all([
    getProjectUpdates(project.id),
    getProjectMedia(project.id),
  ]);

  const name = pick(project, "name", locale);
  const description = pick(project, "description", locale);
  const district = getDistrict(project.district);
  const districtName = district ? (locale === "ml" ? district.ml : district.en) : project.district;
  const counter = computeDayCounter(project);
  const youtubeId = project.youtube_url ? extractYouTubeId(project.youtube_url) : null;
  const pageUrl = `${SITE_CONFIG.siteUrl}/${locale}/projects/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description: description || undefined,
    datePublished: project.reported_on ?? project.submitted_on,
    about:
      project.latitude != null && project.longitude != null
        ? {
            "@type": "Place",
            name: `${districtName}${project.local_body ? `, ${project.local_body}` : ""}`,
            geo: { "@type": "GeoCoordinates", latitude: project.latitude, longitude: project.longitude },
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.nav.projects, item: `${SITE_CONFIG.siteUrl}/${locale}/projects` },
      { "@type": "ListItem", position: 2, name: districtName, item: `${SITE_CONFIG.siteUrl}/${locale}/projects/district/${project.district}` },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }}
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="flex flex-col">
        <Link
          href={`/${locale}/projects`}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          &larr; {dict.detail.back_to_projects}
        </Link>
        <div className="mt-8">
          <StatusBadge status={project.status} dict={dict} />
          <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-5xl">{name}</h1>
            <p className="mt-4 text-base text-muted-foreground">
              {districtName}
              {project.local_body ? ` · ${project.local_body}` : ""}
            </p>
          {description && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">{description}</p>}
        </div>
        </div>

        <div>
          <DayCounter
            reportedOn={project.reported_on}
            submittedOn={project.submitted_on}
            resolvedOn={project.resolved_on}
            dict={dict}
          />

          {project.promised_completion_on && !counter.frozen && (
            <p className="border-x border-b bg-orange-50 px-5 py-3 text-center text-sm font-semibold text-orange-950 dark:bg-orange-950 dark:text-orange-100">
              {t(dict.detail.overdue_note, {
                date: formatDateIST(project.promised_completion_on, locale),
                days: daysOverdue(project.promised_completion_on).toLocaleString("en-IN"),
              })}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden border bg-border text-sm [&>div]:bg-background [&>div]:p-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.detail.cost_label}</dt>
          <dd className="mt-0.5 font-medium">
            {typeof project.cost_inr === "number"
              ? `${formatCostINR(project.cost_inr, dict)}${
                  project.cost_note
                    ? ` (${project.cost_note === "sanctioned" ? dict.detail.cost_sanctioned : dict.detail.cost_revised})`
                    : ""
                }`
              : dict.detail.cost_unknown}
          </dd>
        </div>
        {project.tenure && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.detail.tenure_label}</dt>
            <dd className="mt-0.5 font-medium">{project.tenure}</dd>
          </div>
        )}
        {project.inaugurated_on && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.detail.inaugurated_label}</dt>
            <dd className="mt-0.5 font-medium">{formatDateIST(project.inaugurated_on, locale)}</dd>
          </div>
        )}
        {project.department && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.detail.department_label}</dt>
            <dd className="mt-0.5 font-medium">{project.department}</dd>
          </div>
        )}
      </dl>

      {(project.instagram_url || youtubeId) && (
        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
          {project.instagram_url && <InstagramEmbed url={project.instagram_url} dict={dict} />}
          {youtubeId && <YouTubeEmbed videoId={youtubeId} dict={dict} />}
        </div>
      )}

      {media.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{dict.detail.gallery_title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={getPublicPhotoUrl(item.storage_path)}
                  alt={pick(item, "caption", locale) || name}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {project.latitude != null && project.longitude != null && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{dict.detail.map_title}</h2>
          <ProjectMap lat={project.latitude} lng={project.longitude} label={name} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">{dict.detail.timeline_title}</h2>
        <StatusTimeline updates={updates} locale={locale} dict={dict} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <SeenButton projectId={project.id} initialCount={project.seen_count} dict={dict} />
        <ShareButtons url={pageUrl} title={name} dict={dict} />
      </div>
    </div>
  );
}
