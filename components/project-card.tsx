import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { computeDayCounter, daysOverdue, formatDateIST } from "@/lib/dates";
import { formatCostINR, formatDays } from "@/lib/format";
import { getArea } from "@/lib/areas";
import { getWard } from "@/lib/directory";
import { pick } from "@/lib/pick";
import { getPublicPhotoUrl } from "@/lib/storage";
import type { Locale } from "@/lib/i18n/config";
import { t, type Dictionary } from "@/lib/i18n/dict";
import type { ProjectListItem } from "@/lib/types";
import { ArrowUpRight, MapPin } from "lucide-react";

/**
 * One issue in a list. It carries what is known about the issue so a
 * reader can scan the list without opening each record: photo, summary,
 * ward, and the dated facts. A field that is not on record is left off
 * the card rather than listed as unknown; the full record says so.
 *
 * The ward is shown as a place (number and name) only. The ward member
 * stays in the jurisdiction block on the issue page (see CLAUDE.md).
 */
export function ProjectCard({
  project,
  locale,
  dict,
}: {
  project: ProjectListItem;
  locale: Locale;
  dict: Dictionary;
}) {
  const name = pick(project, "name", locale);
  const description = pick(project, "description", locale);
  const area = getArea(project.area);
  const ward = getWard(project.ward_no);
  const counter = computeDayCounter(project);
  const latestUpdateTitle = pick(project, "latest_update_title", locale);
  const overdueDays =
    project.promised_completion_on && !counter.frozen ? daysOverdue(project.promised_completion_on) : 0;

  const facts: { label: string; value: ReactNode }[] = [];
  if (ward) {
    facts.push({
      label: dict.detail.ward_label,
      value: `${String(ward.no).padStart(2, "0")} · ${ward.name}`,
    });
  }
  if (project.department) {
    facts.push({ label: dict.detail.department_label, value: project.department });
  }
  if (typeof project.cost_inr === "number") {
    facts.push({
      label: dict.detail.cost_label,
      value: `${formatCostINR(project.cost_inr, dict)}${
        project.cost_note
          ? ` (${project.cost_note === "sanctioned" ? dict.detail.cost_sanctioned : dict.detail.cost_revised})`
          : ""
      }`,
    });
  }
  if (project.promised_completion_on && !counter.frozen) {
    facts.push({
      label: dict.projects.card_due_label,
      value: (
        <>
          <span className="tabular-nums">{formatDateIST(project.promised_completion_on, locale)}</span>
          {overdueDays > 0 && (
            <span className="block font-bold">
              {t(dict.projects.card_overdue, { days: formatDays(overdueDays, dict) })}
            </span>
          )}
        </>
      ),
    });
  }
  if (project.latest_update_on) {
    facts.push({
      label: dict.projects.card_last_update_label,
      value: (
        <>
          <span className="tabular-nums">{formatDateIST(project.latest_update_on, locale)}</span>
          {latestUpdateTitle && (
            <span className="line-clamp-2 text-muted-foreground">{latestUpdateTitle}</span>
          )}
        </>
      ),
    });
  }

  return (
    <Link
      href={`/${locale}/issues/${project.slug}`}
      className="group flex h-full flex-col border bg-background transition-colors hover:border-board-300 hover:bg-board-50 dark:hover:bg-board-950/20"
    >
      {project.cover_path && (
        <div className="relative aspect-square overflow-hidden border-b bg-muted">
          <Image
            src={getPublicPhotoUrl(project.cover_path)}
            alt={pick(project, "cover_caption", locale)}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <article className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge status={project.status} dict={dict} />
          <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-board-600" />
        </div>
        <p className="mt-5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span>
            {area ? (locale === "ml" ? area.ml : area.en) : project.area}
            {project.local_body ? ` · ${project.local_body}` : ""}
          </span>
        </p>
        <h3 className="mt-2 text-xl font-black leading-tight tracking-tight">{name}</h3>
        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {facts.length > 0 && (
          <dl className="mt-5 divide-y border-y text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground [overflow-wrap:anywhere]">{fact.label}</dt>
                <dd className="min-w-0 font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <p className="text-xs font-bold uppercase leading-tight tracking-wide text-muted-foreground">
            {counter.frozen
              ? dict.detail.resolved_after.replace("{days}", counter.days.toLocaleString("en-IN"))
              : (counter.basis === "reported"
                  ? dict.detail.days_since_reported
                  : dict.detail.days_since_flagged)}
          </p>
          {!counter.frozen && (
            <p className="shrink-0 text-4xl font-black tabular-nums tracking-tighter text-board-600">
              {counter.days.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
