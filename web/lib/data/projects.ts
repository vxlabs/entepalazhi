import "server-only";
import { unstable_cache } from "next/cache";
import { likePattern, query, queryOne, type SqlParams } from "@/lib/db";
import type { Project, ProjectListFilters, ProjectListItem, ProjectMedia, ProjectUpdate } from "@/lib/types";

/**
 * Public reads. The database does not enforce visibility, so EVERY query
 * in this file must carry this filter (directly, or through a join to
 * projects for child rows). Unpublished and archived rows are read only
 * from lib/data/admin.ts.
 */
const VISIBLE = "p.is_published = 1 and p.archived_at is null";

/**
 * `select ... from` for the list pages: each issue with its first photo
 * (same order as getProjectMedia) and its most recent update (same order
 * as getProjectUpdates). Both hang off a row that already passed VISIBLE.
 */
const LIST_SELECT = `
  select p.*,
         cover.storage_path as cover_path,
         cover.caption_en   as cover_caption_en,
         cover.caption_ml   as cover_caption_ml,
         latest.happened_on as latest_update_on,
         latest.title_en    as latest_update_title_en,
         latest.title_ml    as latest_update_title_ml
    from projects p
    left join project_media cover on cover.id = (
           select m.id from project_media m
            where m.project_id = p.id
            order by m.sort_order asc, m.created_at asc limit 1)
    left join project_updates latest on latest.id = (
           select u.id from project_updates u
            where u.project_id = p.id
            order by u.happened_on desc, u.created_at desc limit 1)`;

export async function getFilteredProjects(filters: ProjectListFilters): Promise<ProjectListItem[]> {
  const where = [VISIBLE];
  const params: SqlParams = {};

  if (filters.area) {
    where.push("p.area = @area");
    params.area = filters.area;
  }
  if (filters.status) {
    where.push("p.status = @status");
    params.status = filters.status;
  }
  if (filters.department) {
    where.push("p.department = @department");
    params.department = filters.department;
  }
  if (filters.q && filters.q.trim().length > 0) {
    where.push("(p.name_en like @q escape '\\' or p.name_ml like @q escape '\\')");
    params.q = likePattern(filters.q.trim());
  }

  let orderBy: string;
  switch (filters.sort) {
    case "days_desc":
      // Older reported_on (or, absent that, submitted_on) = more days
      // outstanding. Rows with no reported_on yet sort last.
      orderBy = "case when p.reported_on is null then 1 else 0 end, p.reported_on asc, p.submitted_on asc";
      break;
    case "cost_desc":
      orderBy = "case when p.cost_inr is null then 1 else 0 end, p.cost_inr desc";
      break;
    case "newest":
    default:
      orderBy = "p.submitted_on desc, p.created_at desc";
  }

  return query<ProjectListItem>(`${LIST_SELECT} where ${where.join(" and ")} order by ${orderBy}`, params);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return queryOne<Project>(`select p.* from projects p where p.slug = @slug and ${VISIBLE}`, { slug });
}

export async function getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  return query<ProjectUpdate>(
    `select u.* from project_updates u
       join projects p on p.id = u.project_id
      where u.project_id = @project_id and ${VISIBLE}
      order by u.happened_on desc, u.created_at desc`,
    { project_id: projectId },
  );
}

export async function getProjectMedia(projectId: string): Promise<ProjectMedia[]> {
  return query<ProjectMedia>(
    `select m.* from project_media m
       join projects p on p.id = m.project_id
      where m.project_id = @project_id and ${VISIBLE}
      order by m.sort_order asc`,
    { project_id: projectId },
  );
}

/** Every published slug, for the sitemap. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`select p.slug from projects p where ${VISIBLE}`);
  return rows.map((row) => row.slug);
}

export async function getRecentProjects(limit: number): Promise<ProjectListItem[]> {
  return query<ProjectListItem>(
    `${LIST_SELECT} where ${VISIBLE} order by p.submitted_on desc, p.created_at desc limit @limit`,
    { limit },
  );
}

export function getProjectsByArea(area: string): Promise<ProjectListItem[]> {
  return getFilteredProjects({ area, sort: "newest" });
}

/** Distinct, non-empty department values among published issues, for the filter dropdown. */
export async function getDistinctDepartments(): Promise<string[]> {
  const rows = await query<{ department: string }>(
    `select distinct p.department from projects p
      where ${VISIBLE} and p.department is not null and ltrim(rtrim(p.department)) <> ''
      order by p.department`,
  );
  return rows.map((row) => row.department);
}

export type StatsSummary = {
  projects_tracked: number;
  total_cost_inr: number;
  combined_days_pending: number;
  resolved_count: number;
};

async function computeStatsSummary(): Promise<StatsSummary> {
  const rows = await query<Pick<Project, "cost_inr" | "reported_on" | "submitted_on" | "resolved_on" | "status">>(
    `select p.cost_inr, p.reported_on, p.submitted_on, p.resolved_on, p.status from projects p where ${VISIBLE}`,
  );

  const { differenceInCalendarDays, parseISO } = await import("date-fns");
  const { toZonedTime } = await import("date-fns-tz");
  const today = toZonedTime(new Date(), "Asia/Kolkata");

  let totalCost = 0;
  let combinedDays = 0;
  let resolvedCount = 0;

  for (const row of rows) {
    if (typeof row.cost_inr === "number") totalCost += row.cost_inr;
    const from = parseISO(row.reported_on ?? row.submitted_on);
    const end = row.resolved_on ? parseISO(row.resolved_on) : today;
    combinedDays += Math.max(0, differenceInCalendarDays(end, from));
    if (row.status === "completed" && row.resolved_on) resolvedCount += 1;
  }

  return {
    projects_tracked: rows.length,
    total_cost_inr: totalCost,
    combined_days_pending: combinedDays,
    resolved_count: resolvedCount,
  };
}

/** Recomputed at most hourly rather than per request; admin edits clear it
 * straight away (see revalidatePublicRoutes in lib/revalidate.ts). */
export const getStatsSummary = unstable_cache(computeStatsSummary, ["stats-summary"], {
  revalidate: 3600,
  tags: ["stats-summary"],
});
