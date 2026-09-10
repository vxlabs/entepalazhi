import type { Metadata } from "next";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { CheckCircle2, ChevronRight, ClipboardCheck, FilePlus2, FolderKanban, Send } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { getAdminDashboardSummary, getPendingSubmissions, getStaleProjects, getUnfilmedLeads, getRecentlyResolved } from "@/lib/data/admin";
import { AdminPage, PageHeader } from "@/components/admin/page-header";
import { StatTile, SectionCard, MuseTableHeader, MuseTableRow, BarMeter, LineChart, Timeline, TimelineItem } from "@/components/admin/muse-ui";
import { getDictionary } from "@/lib/i18n/dict";
import { pick } from "@/lib/pick";
import { getDistrict } from "@/lib/kerala";
import { parseDateOnly, todayInIST } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { STATUS_META, STATUS_ORDER } from "@/lib/status-meta";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

const DISTRICTS_SHOWN = 9;
const ATTENTION_PER_BUCKET = 3;

function relativeDays(dateStr: string): string {
  const days = differenceInCalendarDays(todayInIST(), parseDateOnly(dateStr));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

type AttentionRow = { id: string; name: string; district: string; why: string; warn: boolean };

export default async function AdminHomePage() {
  await requireAdminPage();
  const dict = getDictionary("en");
  const [summary, pending, stale, unfilmed, resolved] = await Promise.all([
    getAdminDashboardSummary(),
    getPendingSubmissions(),
    getStaleProjects(),
    getUnfilmedLeads(),
    getRecentlyResolved(5),
  ]);

  const districtsWithCases = summary.districtCounts.filter((district) => district.count > 0);
  const visibleDistricts = districtsWithCases.slice(0, DISTRICTS_SHOWN);

  const notices = [
    pending.length > 0 && `${pending.length} need${pending.length === 1 ? "s" : ""} review`,
    stale.length > 0 && `${stale.length} going stale`,
    unfilmed.length > 0 && `${unfilmed.length} to film`,
  ].filter((notice): notice is string => Boolean(notice));

  const districtLabel = (project: Project) => getDistrict(project.district)?.en ?? project.district;

  // A case can land in more than one bucket (an unpublished public lead is both
  // pending and unfilmed), so keep the first — most urgent — reason for each id.
  const seen = new Set<string>();
  const takeUnique = <T extends Project>(projects: T[], toRow: (project: T) => AttentionRow) => {
    const rows: AttentionRow[] = [];
    for (const project of projects) {
      if (rows.length === ATTENTION_PER_BUCKET) break;
      if (seen.has(project.id)) continue;
      seen.add(project.id);
      rows.push(toRow(project));
    }
    return rows;
  };

  const attentionRows: AttentionRow[] = [
    ...takeUnique(pending, (project) => ({
      id: project.id,
      name: project.name_en,
      district: districtLabel(project),
      why: `Submitted ${relativeDays(project.submitted_on)}`,
      warn: false,
    })),
    ...takeUnique(stale, (project) => {
      const days = differenceInCalendarDays(todayInIST(), parseDateOnly(project.reported_on ?? project.submitted_on));
      return {
        id: project.id,
        name: project.name_en,
        district: districtLabel(project),
        why: `${days} days since last update`,
        warn: true,
      };
    }),
    ...takeUnique(unfilmed, (project) => ({
      id: project.id,
      name: project.name_en,
      district: districtLabel(project),
      why: "Lead, not filmed yet",
      warn: false,
    })),
  ];

  const monthlyAdded = summary.monthlyTrend.at(-1)?.added ?? 0;

  return (
    <AdminPage>
      <PageHeader
        title="Home"
        description={notices.length > 0 ? notices.join(" · ") : "You're all caught up."}
        action={
          <Link href="/admin/projects/new" className={buttonVariants()}>
            <FilePlus2 className="size-4" /> Add case
          </Link>
        }
      />

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active cases" value={summary.activeCount} icon={FolderKanban} href="/admin/projects" />
        <StatTile
          label="Needs review"
          value={pending.length}
          delta={pending.length > 0 ? "Review now" : "All clear"}
          deltaTone={pending.length > 0 ? "warn" : "up"}
          icon={ClipboardCheck}
          href="/admin/queue"
        />
        <StatTile label="Ever reported" value={summary.everReportedCount} icon={Send} href="/admin/projects?reported=true" />
        <StatTile label="Completed" value={summary.statusCounts.completed} icon={CheckCircle2} href="/admin/projects?status=completed" />
      </section>

      <section aria-label="Case breakdowns" className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          title="Cases by district"
          subtitle={`${districtsWithCases.length} districts with active cases`}
          tone="dark"
          className="lg:col-span-2"
        >
          {visibleDistricts.length > 0 ? (
            <>
              <BarMeter
                tone="dark"
                data={visibleDistricts.map((d) => ({ key: d.slug, label: d.name, value: d.count }))}
                hrefFor={(slug) => `/admin/projects?district=${slug}`}
              />
              <div className="mt-5 grid grid-cols-2 divide-x divide-white/15 rounded-xl bg-white/10 sm:grid-cols-4">
                {[
                  { label: "Active", value: summary.activeCount },
                  { label: "Published", value: summary.publishedCount },
                  { label: "Drafts", value: summary.draftCount },
                  { label: "Districts", value: districtsWithCases.length },
                ].map((cell) => (
                  <div key={cell.label} className="flex flex-col items-center gap-0.5 px-2 py-3 text-center">
                    <span className="text-lg font-bold tabular-nums">{cell.value}</span>
                    <span className="text-[11px] text-white/70">{cell.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-white/75">Add your first case to see the district breakdown.</p>
          )}
        </SectionCard>

        <SectionCard title="Cases over time" subtitle={`${monthlyAdded} added this month`} className="lg:col-span-3">
          <LineChart
            points={summary.monthlyTrend.map((m) => ({ label: m.label }))}
            series={[
              { key: "added", label: "Added", color: "var(--primary)", values: summary.monthlyTrend.map((m) => m.added) },
              { key: "reported", label: "Reported", color: "var(--muted-foreground)", values: summary.monthlyTrend.map((m) => m.reported) },
            ]}
          />
        </SectionCard>
      </section>

      <section aria-label="Needs your attention and recent activity" className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          title="Needs your attention"
          subtitle="Pending review, going stale, or waiting to be filmed"
          className="lg:col-span-3"
          action={
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
              <Link href="/admin/queue" className="text-primary hover:underline">
                Reviews ({pending.length})
              </Link>
              <Link href="/admin/projects?status=reported" className="text-primary hover:underline">
                Stale ({stale.length})
              </Link>
              <Link href="/admin/projects?status=lead&reported=false" className="text-primary hover:underline">
                Unfilmed ({unfilmed.length})
              </Link>
            </div>
          }
        >
          {attentionRows.length > 0 ? (
            <div>
              <MuseTableHeader>
                <span className="flex-1">Case</span>
                <span className="hidden w-28 shrink-0 sm:block">District</span>
                <span className="w-36 shrink-0 text-right sm:text-left">Why</span>
              </MuseTableHeader>
              <div className="divide-y divide-border/70">
                {attentionRows.map((row) => (
                  <MuseTableRow key={row.id} href={`/admin/projects/${row.id}`}>
                    <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                    <span className="hidden w-28 shrink-0 truncate text-muted-foreground sm:block">{row.district}</span>
                    <span className={cn("w-36 shrink-0 truncate text-right text-xs sm:text-left", row.warn ? "text-destructive" : "text-muted-foreground")}>
                      {row.why}
                    </span>
                    <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                  </MuseTableRow>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Nothing needs your attention right now.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Recently completed"
          subtitle="Latest cases marked resolved"
          className="lg:col-span-2"
          action={
            <Link href="/admin/projects?status=completed" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {resolved.length > 0 ? (
            <Timeline>
              {resolved.map((project, index) => (
                <TimelineItem
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  icon={STATUS_META.completed.icon}
                  dotClassName={STATUS_META.completed.dot}
                  title={pick(project, "name", "en")}
                  meta={districtLabel(project)}
                  last={index === resolved.length - 1}
                />
              ))}
            </Timeline>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Completed cases will appear here.</p>
          )}
        </SectionCard>
      </section>

      <SectionCard title="Where cases stand" subtitle="All active cases by status">
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            return (
              <Link
                key={status}
                href={`/admin/projects?status=${status}`}
                className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm font-medium">{dict.status[status]}</span>
                <span className="text-sm font-semibold tabular-nums">{summary.statusCounts[status]}</span>
              </Link>
            );
          })}
        </div>
      </SectionCard>
    </AdminPage>
  );
}
