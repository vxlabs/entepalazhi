import "server-only";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { KERALA_DISTRICTS } from "@/lib/kerala";
import { todayInIST } from "@/lib/dates";
import type { AdminAuditLog, Project, ProjectMedia, ProjectStatus, ProjectSubmitter, ProjectUpdate } from "@/lib/types";

const STALE_AFTER_DAYS = 90;

// ---------------------------------------------------------------------
// Triage home - "what needs me today"
// ---------------------------------------------------------------------

export type DashboardDistrictCount = {
  slug: string;
  name: string;
  count: number;
};

/** One month's worth of the dashboard's "cases over time" line chart. */
export type MonthlyTrendPoint = {
  /** "2026-03" */
  month: string;
  /** Short label for chart axes, e.g. "Mar". */
  label: string;
  added: number;
  reported: number;
};

export type AdminDashboardSummary = {
  activeCount: number;
  publishedCount: number;
  draftCount: number;
  everReportedCount: number;
  statusCounts: Record<ProjectStatus, number>;
  districtCounts: DashboardDistrictCount[];
  monthlyTrend: MonthlyTrendPoint[];
};

const TREND_MONTHS = 12;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The last `TREND_MONTHS` calendar months, oldest first, each pre-seeded at zero. */
function emptyTrend(): Map<string, MonthlyTrendPoint> {
  const trend = new Map<string, MonthlyTrendPoint>();
  const anchor = todayInIST();
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1));
    trend.set(monthKey(d), { month: monthKey(d), label: MONTH_LABELS[d.getUTCMonth()], added: 0, reported: 0 });
  }
  return trend;
}

/**
 * A compact, request-time overview of every active case. This deliberately
 * includes drafts and pending submissions: the admin dashboard is an
 * operations view, rather than a mirror of the public catalogue.
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("district, status, reported_on, submitted_on, is_published")
    .is("archived_at", null);
  if (error) throw error;

  const statusCounts: Record<ProjectStatus, number> = {
    lead: 0,
    reported: 0,
    acknowledged: 0,
    work_resumed: 0,
    completed: 0,
    no_action: 0,
  };
  const districtCounts = new Map(KERALA_DISTRICTS.map((district) => [district.slug, 0]));
  const monthlyTrend = emptyTrend();
  let publishedCount = 0;
  let everReportedCount = 0;

  type Row = Pick<Project, "district" | "status" | "reported_on" | "submitted_on" | "is_published">;
  for (const row of (data ?? []) as Row[]) {
    statusCounts[row.status] += 1;
    districtCounts.set(row.district, (districtCounts.get(row.district) ?? 0) + 1);
    if (row.is_published) publishedCount += 1;
    if (row.reported_on) everReportedCount += 1;

    const addedKey = row.submitted_on.slice(0, 7);
    const addedPoint = monthlyTrend.get(addedKey);
    if (addedPoint) addedPoint.added += 1;

    if (row.reported_on) {
      const reportedKey = row.reported_on.slice(0, 7);
      const reportedPoint = monthlyTrend.get(reportedKey);
      if (reportedPoint) reportedPoint.reported += 1;
    }
  }

  return {
    activeCount: data?.length ?? 0,
    publishedCount,
    draftCount: (data?.length ?? 0) - publishedCount,
    everReportedCount,
    statusCounts,
    districtCounts: KERALA_DISTRICTS.map((district) => ({
      slug: district.slug,
      name: district.en,
      count: districtCounts.get(district.slug) ?? 0,
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    monthlyTrend: [...monthlyTrend.values()],
  };
}

/** Cheap unread-count for the topbar bell - avoid the full submitter/media
 * joins that getPendingSubmissions() needs, since this renders on every
 * admin page. */
export async function getPendingCount(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("source", "public")
    .eq("is_published", false)
    .is("archived_at", null);
  if (error) throw error;
  return count ?? 0;
}

export type PendingSubmission = Project & { submitter: ProjectSubmitter | null; photoCount: number };

export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_submitters(*), project_media(id)")
    .eq("source", "public")
    .eq("is_published", false)
    .is("archived_at", null)
    .order("submitted_on", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { project_submitters, project_media, ...project } = row as Project & {
      project_submitters: ProjectSubmitter[];
      project_media: { id: string }[];
    };
    return {
      ...project,
      submitter: project_submitters?.[0] ?? null,
      photoCount: project_media?.length ?? 0,
    };
  });
}

/** Published, still "reported", with no timeline entry in 90+ days - the
 * list that keeps the site's "tracks what happened after" claim true. */
export async function getStaleProjects(): Promise<Project[]> {
  const supabase = createAdminClient();
  const { data: candidates, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .is("archived_at", null)
    .eq("status", "reported");
  if (error) throw error;
  if (!candidates?.length) return [];

  const { data: updates, error: updatesError } = await supabase
    .from("project_updates")
    .select("project_id, happened_on")
    .in(
      "project_id",
      candidates.map((p) => p.id),
    )
    .order("happened_on", { ascending: false });
  if (updatesError) throw updatesError;

  const latestByProject = new Map<string, string>();
  for (const u of updates ?? []) {
    if (!latestByProject.has(u.project_id)) latestByProject.set(u.project_id, u.happened_on);
  }

  const today = new Date();
  return (candidates as Project[]).filter((p) => {
    const latest = latestByProject.get(p.id) ?? p.reported_on ?? p.submitted_on;
    return differenceInCalendarDays(today, parseISO(latest)) >= STALE_AFTER_DAYS;
  });
}

/** His shooting backlog: leads with no reported_on yet, oldest first. */
export async function getUnfilmedLeads(): Promise<Project[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "lead")
    .is("reported_on", null)
    .is("archived_at", null)
    .order("submitted_on", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getRecentlyResolved(limit = 5): Promise<Project[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "completed")
    .not("resolved_on", "is", null)
    .is("archived_at", null)
    .order("resolved_on", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Project[];
}

// ---------------------------------------------------------------------
// /admin/projects - full list
// ---------------------------------------------------------------------

export type AdminProjectFilters = {
  status?: string;
  district?: string;
  published?: boolean;
  reported?: boolean;
  query?: string;
};

export async function getAllProjectsAdmin(filters: AdminProjectFilters = {}): Promise<Project[]> {
  const supabase = createAdminClient();
  let query = supabase.from("projects").select("*").is("archived_at", null);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.district) query = query.eq("district", filters.district);
  if (typeof filters.published === "boolean") query = query.eq("is_published", filters.published);
  if (typeof filters.reported === "boolean") {
    query = filters.reported ? query.not("reported_on", "is", null) : query.is("reported_on", null);
  }
  if (filters.query) {
    const escaped = filters.query.replace(/[,%()]/g, " ").trim();
    if (escaped) query = query.or(`name_en.ilike.%${escaped}%,name_ml.ilike.%${escaped}%`);
  }
  query = query.order("submitted_on", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

// ---------------------------------------------------------------------
// /admin/projects/[id] - the editor
// ---------------------------------------------------------------------

export type ProjectEditorData = {
  project: Project;
  media: ProjectMedia[];
  updates: ProjectUpdate[];
  submitter: ProjectSubmitter | null;
  auditLog: AdminAuditLog[];
};

export async function getProjectForEditor(id: string): Promise<ProjectEditorData | null> {
  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) return null;

  const [{ data: media, error: mediaError }, { data: updates, error: updatesError }, { data: submitters, error: submittersError }, { data: auditLog, error: auditError }] =
    await Promise.all([
      supabase.from("project_media").select("*").eq("project_id", id).order("sort_order", { ascending: true }),
      supabase.from("project_updates").select("*").eq("project_id", id).order("happened_on", { ascending: false }),
      supabase.from("project_submitters").select("*").eq("project_id", id),
      supabase.from("admin_audit_log").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);

  if (mediaError) throw mediaError;
  if (updatesError) throw updatesError;
  if (submittersError) throw submittersError;
  if (auditError) throw auditError;

  return {
    project: project as Project,
    media: (media ?? []) as ProjectMedia[],
    updates: (updates ?? []) as ProjectUpdate[],
    submitter: (submitters as ProjectSubmitter[] | null)?.[0] ?? null,
    auditLog: (auditLog ?? []) as AdminAuditLog[],
  };
}
