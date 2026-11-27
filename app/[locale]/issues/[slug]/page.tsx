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
import { computeDayCounter, daysOverdue, formatDateIST } from "@/lib/dates";
import { formatCostINR } from "@/lib/format";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, t } from "@/lib/i18n/dict";
import { getArea } from "@/lib/areas";
import { DIRECTORY_AS_OF, WARDS_SOURCE_URL, getWard } from "@/lib/directory";
import { pick } from "@/lib/pick";
import { SITE_CONFIG } from "@/lib/site-config";
import { getPublicPhotoUrl } from "@/lib/storage";
import {
  getProjectBySlug,
  getProjectMedia,
  getProjectUpdates,
} from "@/lib/data/projects";


type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const name = pick(project, "name", locale);
  const description = pick(project, "description", locale);
  const pathname = `/${locale}/issues/${slug}`;

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
  const area = getArea(project.area);
  const areaName = area ? (locale === "ml" ? area.ml : area.en) : project.area;
  // Looked up at render time, so the contact block always shows whoever
  // the Panchayat lists now (see lib/directory.ts).
  const ward = getWard(project.ward_no);
  const wardName = ward ? t(dict.detail.ward_value, { no: ward.no, name: ward.name }) : null;
  const contractorSourceIsUrl = /^https?:\/\//i.test(project.contractor_source ?? "");
  const counter = computeDayCounter(project);
  const youtubeId = project.youtube_url ? extractYouTubeId(project.youtube_url) : null;
  const pageUrl = `${SITE_CONFIG.siteUrl}/${locale}/issues/${slug}`;

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
            name: `${areaName}${project.local_body ? `, ${project.local_body}` : ""}`,
            geo: { "@type": "GeoCoordinates", latitude: project.latitude, longitude: project.longitude },
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.nav.projects, item: `${SITE_CONFIG.siteUrl}/${locale}/issues` },
      { "@type": "ListItem", position: 2, name: areaName, item: `${SITE_CONFIG.siteUrl}/${locale}/issues/area/${project.area}` },
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
          href={`/${locale}/issues`}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          &larr; {dict.detail.back_to_projects}
        </Link>
        <div className="mt-8">
          <StatusBadge status={project.status} dict={dict} />
          <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-5xl">{name}</h1>
            <p className="mt-4 text-base text-muted-foreground">
              {areaName}
              {wardName ? ` · ${wardName}` : ""}
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
            <p className="border-x border-b bg-board-50 px-5 py-3 text-center text-sm font-semibold text-board-950 dark:bg-board-950 dark:text-board-100">
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
        {project.contractor_name && (
          <div className="col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.detail.contractor_label}</dt>
            <dd className="mt-0.5 font-medium">{project.contractor_name}</dd>
            {project.contractor_source && (
              <dd className="mt-1 text-xs text-muted-foreground">
                {contractorSourceIsUrl ? (
                  <a
                    href={project.contractor_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {dict.detail.source}
                  </a>
                ) : (
                  `${dict.detail.source}: ${project.contractor_source}`
                )}
              </dd>
            )}
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

      {/* Representatives appear only here: jurisdiction and contact, in a
          neutral block apart from the issue - never in the heading, the
          day counter or the share card (see CLAUDE.md). */}
      {ward && (
        <section aria-labelledby="jurisdiction-title" className="border bg-muted/30 p-5">
          <h2 id="jurisdiction-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {dict.detail.jurisdiction_title}
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{dict.detail.ward_label}</dt>
              <dd className="mt-0.5 font-medium">
                {String(ward.no).padStart(2, "0")} · {ward.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{dict.detail.ward_member_label}</dt>
              <dd className="mt-0.5 font-medium">{ward.member}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{dict.detail.phone_label}</dt>
              <dd className="mt-0.5 font-medium">
                <a
                  href={`tel:${ward.phone}`}
                  aria-label={t(dict.detail.call_aria, { number: ward.phone })}
                  className="tabular-nums underline decoration-board-500 decoration-2 underline-offset-4 hover:decoration-foreground"
                >
                  {ward.phone}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{dict.detail.ward_member_note}</p>
          <a
            href={WARDS_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t(dict.detail.ward_source, { date: formatDateIST(DIRECTORY_AS_OF, locale) })}
          </a>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <ShareButtons url={pageUrl} title={name} dict={dict} />
      </div>
    </div>
  );
}
