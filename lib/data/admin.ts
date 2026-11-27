import "server-only";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { isUuid, likePattern, query, queryOne, type SqlParams } from "@/lib/db";
import { PALAZHI_AREAS } from "@/lib/areas";
import { todayInIST } from "@/lib/dates";
import type { AdminAuditLog, Project, ProjectMedia, ProjectStatus, ProjectSubmitter, ProjectUpdate } from "@/lib/types";

// Admin reads: these see drafts, pending reports and submitter contact
// details. Every caller must have passed requireAdmin()/requireAdminPage().

const STALE_AFTER_DAYS = 90;

// ---------------------------------------------------------------------
// Triage home - "what needs attention today"
// ---------------------------------------------------------------------

export type DashboardAreaCount = {
  slug: string;
  name: string;
  count: number;
};

/** One month's worth of the dashboard's "issues over time" line chart. */
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
  areaCounts: DashboardAreaCount[];
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
    const key = monthKey(d);
    trend.set(key, { month: key, label: MONTH_LABELS[d.getUTCMonth()], added: 0, reported: 0 });
  }
  return trend;
}

/**
 * A compact, request-time overview of every active issue. This deliberately
 * includes drafts and pending reports: the admin dashboard is an
 * operations view, not a mirror of the public record.
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  type Row = Pick<Project, "area" | "status" | "reported_on" | "submitted_on" | "is_published">;
  const rows = await query<Row>(
    "select area, status, reported_on, submitted_on, is_published from projects where archived_at is null",
  );

  const statusCounts: Record<ProjectStatus, number> = {
    lead: 0,
    reported: 0,
    acknowledged: 0,
    work_resumed: 0,
    completed: 0,
    no_action: 0,
  };
  const areaCounts = new Map(PALAZHI_AREAS.map((area) => [area.slug, 0]));
  const monthlyTrend = emptyTrend();
  let publishedCount = 0;
  let everReportedCount = 0;

  for (const row of rows) {
    statusCounts[row.status] += 1;
    areaCounts.set(row.area, (areaCounts.get(row.area) ?? 0) + 1);
    if (row.is_published) publishedCount += 1;
    if (row.reported_on) everReportedCount += 1;

    const addedPoint = monthlyTrend.get(row.submitted_on.slice(0, 7));
    if (addedPoint) addedPoint.added += 1;

    if (row.reported_on) {
      const reportedPoint = monthlyTrend.get(row.reported_on.slice(0, 7));
      if (reportedPoint) reportedPoint.reported += 1;
    }
  }

  return {
    activeCount: rows.length,
    publishedCount,
    draftCount: rows.length - publishedCount,
    everReportedCount,
    statusCounts,
    areaCounts: PALAZHI_AREAS.map((area) => ({
      slug: area.slug,
      name: area.en,
      count: areaCounts.get(area.slug) ?? 0,
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    monthlyTrend: [...monthlyTrend.values()],
  };
}

/** Cheap unread-count for the topbar bell: this renders on every admin page. */
export async function getPendingCount(): Promise<number> {
  const row = await queryOne<{ n: number }>(
    "select count(*) as n from projects where source = 'public' and is_published = 0 and archived_at is null",
  );
  return row?.n ?? 0;
}

export type PendingSubmission = Project & { submitter: ProjectSubmitter | null; photoCount: number };

type SubmitterRow = ProjectSubmitter & { pending_photo_paths: string };

export function parsePendingPhotoPaths(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const projects = await query<Project>(
    `select * from projects
      where source = 'public' and is_published = 0 and archived_at is null
      order by submitted_on asc, created_at asc`,
  );
  if (projects.length === 0) return [];

  const submitters = await query<SubmitterRow>(
    `select s.* from project_submitters s
       join projects p on p.id = s.project_id
      where p.source = 'public' and p.is_published = 0 and p.archived_at is null`,
  );
  const media = await query<{ project_id: string; n: number }>(
    `select m.project_id, count(*) as n from project_media m
       join projects p on p.id = m.project_id
      where p.source = 'public' and p.is_published = 0 and p.archived_at is null
      group by m.project_id`,
  );

  const submitterByProject = new Map(submitters.map((s) => [s.project_id, s]));
  const mediaByProject = new Map(media.map((m) => [m.project_id, m.n]));

  return projects.map((project) => {
    const row = submitterByProject.get(project.id);
    let submitter: ProjectSubmitter | null = null;
    let pendingPhotos = 0;
    if (row) {
      const { pending_photo_paths, ...rest } = row;
      submitter = rest;
      pendingPhotos = parsePendingPhotoPaths(pending_photo_paths).length;
    }
    return { ...project, submitter, photoCount: (mediaByProject.get(project.id) ?? 0) + pendingPhotos };
  });
}

/** Published, still "reported", with no timeline entry in 90+ days - the
 * list that keeps the record's "what happened next" claim true. */
export async function getStaleProjects(): Promise<Project[]> {
  const candidates = await query<Project & { latest_update_on: string | null }>(
    `select p.*, (select max(u.happened_on) from project_updates u where u.project_id = p.id) as latest_update_on
       from projects p
      where p.is_published = 1 and p.archived_at is null and p.status = 'reported'`,
  );

  const today = todayInIST();
  return candidates
    .filter((p) => {
      const latest = p.latest_update_on ?? p.reported_on ?? p.submitted_on;
      return differenceInCalendarDays(today, parseISO(latest)) >= STALE_AFTER_DAYS;
    })
    .map(({ latest_update_on, ...project }) => {
      void latest_update_on;
      return project as Project;
    });
}

/** The verification backlog: leads with no reported_on yet, oldest first. */
export async function getUnverifiedLeads(): Promise<Project[]> {
  return query<Project>(
    `select * from projects
      where status = 'lead' and reported_on is null and archived_at is null
      order by submitted_on asc, created_at asc`,
  );
}

export async function getRecentlyResolved(limit = 5): Promise<Project[]> {
  return query<Project>(
    `select * from projects
      where status = 'completed' and resolved_on is not null and archived_at is null
      order by resolved_on desc
      limit @limit`,
    { limit },
  );
}

// ---------------------------------------------------------------------
// /admin/projects - full list
// ---------------------------------------------------------------------

export type AdminProjectFilters = {
  status?: string;
  area?: string;
  published?: boolean;
  reported?: boolean;
  query?: string;
};

export async function getAllProjectsAdmin(filters: AdminProjectFilters = {}): Promise<Project[]> {
  const where = ["archived_at is null"];
  const params: SqlParams = {};

  if (filters.status) {
    where.push("status = @status");
    params.status = filters.status;
  }
  if (filters.area) {
    where.push("area = @area");
    params.area = filters.area;
  }
  if (typeof filters.published === "boolean") {
    where.push("is_published = @published");
    params.published = filters.published;
  }
  if (typeof filters.reported === "boolean") {
    where.push(filters.reported ? "reported_on is not null" : "reported_on is null");
  }
  if (filters.query?.trim()) {
    where.push("(name_en like @q escape '\\' or name_ml like @q escape '\\')");
    params.q = likePattern(filters.query.trim());
  }

  return query<Project>(
    `select * from projects where ${where.join(" and ")} order by submitted_on desc, created_at desc`,
    params,
  );
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
  if (!isUuid(id)) return null;

  const project = await queryOne<Project>("select * from projects where id = @id", { id });
  if (!project) return null;

  const [media, updates, submitters, auditRows] = await Promise.all([
    query<ProjectMedia>("select * from project_media where project_id = @id order by sort_order asc", { id }),
    query<ProjectUpdate>(
      "select * from project_updates where project_id = @id order by happened_on desc, created_at desc",
      { id },
    ),
    query<SubmitterRow>("select * from project_submitters where project_id = @id", { id }),
    query<Omit<AdminAuditLog, "diff"> & { diff: string | null }>(
      "select * from admin_audit_log where project_id = @id order by created_at desc",
      { id },
    ),
  ]);

  let submitter: ProjectSubmitter | null = null;
  if (submitters[0]) {
    const { pending_photo_paths, ...rest } = submitters[0];
    void pending_photo_paths;
    submitter = rest;
  }

  const auditLog: AdminAuditLog[] = auditRows.map((row) => {
    let diff: Record<string, unknown> | null = null;
    if (row.diff) {
      try {
        diff = JSON.parse(row.diff) as Record<string, unknown>;
      } catch {
        diff = null;
      }
    }
    return { ...row, diff };
  });

  return { project, media, updates, submitter, auditLog };
}
