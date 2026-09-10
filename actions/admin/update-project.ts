"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { projectEditSchema } from "@/lib/schemas";
import type { Project } from "@/lib/types";

export type ProjectFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Kept as an alias while the edit action's public import remains in use. */
export type UpdateProjectState = ProjectFormState;

/** Revalidates every public route a project's own page or listings could
 * appear on, so an edit "goes live immediately despite Phase 1's static
 * rendering" per the plan. */
function revalidatePublicRoutes(slug: string, districts: string[]) {
  for (const locale of ["en", "ml"]) {
    revalidatePath(`/${locale}/projects/${slug}`);
    revalidatePath(`/${locale}/projects`);
    revalidatePath(`/${locale}`);
    for (const district of districts) {
      revalidatePath(`/${locale}/projects/district/${district}`);
    }
  }
  updateTag("stats-summary");
}

export async function updateProject(
  projectId: string,
  _prevState: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const actor = await requireAdmin();
  const parsed = projectEditSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = createAdminClient();

  const { data: before, error: beforeError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (beforeError || !before) return { status: "error", message: "Project not found." };

  const data = parsed.data;
  const intent = formData.get("intent");
  const isPublished = intent === "publish" ? true : intent === "unpublish" ? false : data.is_published;
  const update = {
    name_en: data.name_en,
    name_ml: data.name_ml ?? null,
    description_en: data.description_en ?? null,
    description_ml: data.description_ml ?? null,
    district: data.district,
    local_body: data.local_body ?? null,
    local_body_type: data.local_body_type ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    cost_inr: data.cost_inr ?? null,
    cost_note: data.cost_note ?? null,
    tenure: data.tenure ?? null,
    inaugurated_on: data.inaugurated_on ?? null,
    promised_completion_on: data.promised_completion_on ?? null,
    department: data.department ?? null,
    status: data.status,
    reported_on: data.reported_on ?? null,
    resolved_on: data.resolved_on ?? null,
    instagram_url: data.instagram_url ?? null,
    youtube_url: data.youtube_url ?? null,
    is_published: isPublished,
  };

  const { error } = await supabase.from("projects").update(update).eq("id", projectId);
  if (error) return { status: "error", message: "Could not save changes." };

  const beforeRow = before as Project;
  await writeAuditLog({
    actorEmail: actor.email,
    action: "update_project",
    projectId,
    diff: diffProject(beforeRow, update),
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  revalidatePublicRoutes(beforeRow.slug, Array.from(new Set([beforeRow.district, data.district])));

  return { status: "success" };
}

function diffProject(before: Project, update: Record<string, unknown>): Record<string, unknown> {
  const diff: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update)) {
    const beforeValue = (before as unknown as Record<string, unknown>)[key];
    if (beforeValue !== value) diff[key] = { from: beforeValue, to: value };
  }
  return diff;
}

export async function togglePublish(projectId: string, isPublished: boolean): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .update({ is_published: isPublished })
    .eq("id", projectId)
    .select("slug, district")
    .single();
  if (error || !project) return { ok: false };

  await writeAuditLog({
    actorEmail: actor.email,
    action: isPublished ? "publish_project" : "unpublish_project",
    projectId,
  });

  revalidatePath("/admin/projects");
  revalidatePublicRoutes(project.slug, [project.district]);
  return { ok: true };
}
