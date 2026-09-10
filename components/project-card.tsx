import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { computeDayCounter } from "@/lib/dates";
import { formatCostINR } from "@/lib/format";
import { getDistrict } from "@/lib/kerala";
import { pick } from "@/lib/pick";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import type { Project } from "@/lib/types";
import { ArrowUpRight, MapPin } from "lucide-react";

export function ProjectCard({
  project,
  locale,
  dict,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
}) {
  const name = pick(project, "name", locale);
  const district = getDistrict(project.district);
  const counter = computeDayCounter(project);

  return (
    <Link href={`/${locale}/projects/${project.slug}`} className="group block h-full border bg-background p-5 transition-colors hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 sm:p-6">
      <article className="flex h-full min-h-64 flex-col">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge status={project.status} dict={dict} />
          <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-600" />
        </div>
        <div className="mt-8">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5" />
            {district ? (locale === "ml" ? district.ml : district.en) : project.district}
            {project.local_body ? ` · ${project.local_body}` : ""}
          </p>
          <h3 className="mt-3 text-xl font-black leading-tight tracking-tight">{name}</h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-8">
          <p className="text-xs font-bold uppercase leading-tight tracking-wide text-muted-foreground">
            {counter.frozen
              ? dict.detail.resolved_after.replace("{days}", counter.days.toLocaleString("en-IN"))
              : (counter.basis === "reported"
                  ? dict.detail.days_since_reported
                  : dict.detail.days_since_flagged)}
          </p>
          {!counter.frozen && (
            <p className="shrink-0 text-4xl font-black tabular-nums tracking-tighter text-orange-600">
              {counter.days.toLocaleString("en-IN")}
            </p>
          )}
          {counter.frozen && typeof project.cost_inr === "number" && (
            <p className="shrink-0 text-sm font-bold text-foreground">
              {formatCostINR(project.cost_inr, dict)}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
