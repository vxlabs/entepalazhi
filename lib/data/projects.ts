import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/server";
import type { Project, ProjectListFilters, ProjectMedia, ProjectUpdate } from "@/lib/types";


export async function getFilteredProjects(filters: ProjectListFilters): Promise<Project[]> {
  const supabase = createAnonClient();
  let query = supabase.from("projects").select("*").eq("is_published", true).is("archived_at", null);

  if (filters.district) query = query.eq("district", filters.district);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.department) query = query.eq("department", filters.department);
  if (filters.q && filters.q.trim().length > 0) {
    const term = filters.q.trim().replace(/[%_]/g, "");
    query = query.or(`name_en.ilike.%${term}%,name_ml.ilike.%${term}%`);
  }

  switch (filters.sort) {
    case "days_desc":
      // Older reported_on (or, absent that, submitted_on) = more days
      // pending. Nulls (leads with no reported_on yet) sort last within
      // this key, submitted_on breaks ties for those.
      query = query
        .order("reported_on", { ascending: true, nullsFirst: false })
        .order("submitted_on", { ascending: true });
      break;
    case "cost_desc":
      query = query.order("cost_inr", { ascending: false, nullsFirst: false });
      break;
    case "seen_desc":
      query = query.order("seen_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("submitted_on", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true).is("archived_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as Project | null) ?? null;
}

export async function getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("project_updates")
    .select("*")
    .eq("project_id", projectId)
    .order("happened_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectUpdate[];
}

export async function getProjectMedia(projectId: string): Promise<ProjectMedia[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("project_media")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProjectMedia[];
}

/** Every published slug, for generateStaticParams and the sitemap. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("projects").select("slug").eq("is_published", true).is("archived_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => row.slug as string);
}

export async function getRecentProjects(limit: number): Promise<Project[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true).is("archived_at", null)
    .order("submitted_on", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Project[];
}

export function getProjectsByDistrict(district: string): Promise<Project[]> {
  return getFilteredProjects({ district, sort: "newest" });
}

/** Distinct, non-null department values among published projects, for the filter dropdown. */
export async function getDistinctDepartments(): Promise<string[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("projects")
    .select("department")
    .eq("is_published", true).is("archived_at", null)
    .not("department", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (typeof row.department === "string" && row.department.trim()) set.add(row.department);
  }
  return Array.from(set).sort();
}

export type StatsSummary = {
  projects_tracked: number;
  total_cost_inr: number;
  combined_days_pending: number;
  resolved_count: number;
};

async function computeStatsSummary(): Promise<StatsSummary> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("projects")
    .select("cost_inr, reported_on, submitted_on, resolved_on, status")
    .eq("is_published", true).is("archived_at", null);
  if (error) throw error;
  const rows = data ?? [];

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

/** Revalidated hourly rather than recomputed per request - see the Phase 1 plan. */
export const getStatsSummary = unstable_cache(computeStatsSummary, ["stats-summary"], {
  revalidate: 3600,
  tags: ["stats-summary"],
});
