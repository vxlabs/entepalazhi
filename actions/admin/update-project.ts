"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { revalidatePublicRoutes } from "@/lib/revalidate";
import { isUuid, queryOne, updateRowById } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { projectEditSchema } from "@/lib/schemas";
import type { Project } from "@/lib/types";

export type ProjectFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** What was submitted, on error: React resets the form after every
   * action, so the editor re-fills its fields from this instead of losing
   * what was typed. */
  values?: Record<string, string>;
};

/** Kept as an alias while the edit action's public import remains in use. */
export type UpdateProjectState = ProjectFormState;

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
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values: Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string")) };
  }

  const before = isUuid(projectId)
    ? await queryOne<Project>("select * from projects where id = @id", { id: projectId })
    : null;
  if (!before) return { status: "error", message: "Issue not found." };

  const data = parsed.data;
  const intent = formData.get("intent");
  const isPublished = intent === "publish" ? true : intent === "unpublish" ? false : data.is_published;
  const update = {
    name_en: data.name_en,
    name_ml: data.name_ml ?? null,
    description_en: data.description_en ?? null,
    description_ml: data.description_ml ?? null,
    area: data.area,
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
    ward_no: data.ward_no ?? null,
    contractor_name: data.contractor_name ?? null,
    contractor_source: data.contractor_source ?? null,
    status: data.status,
    reported_on: data.reported_on ?? null,
    resolved_on: data.resolved_on ?? null,
    instagram_url: data.instagram_url ?? null,
    youtube_url: data.youtube_url ?? null,
    is_published: isPublished,
  };

  try {
    await updateRowById("projects", projectId, { ...update, updated_by: actor.email, updated_at: new Date() });
  } catch (error) {
    console.error("updateProject failed:", error);
    return { status: "error", message: "Could not save changes. Check the dates: resolved cannot be before reported.", values: Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string")) };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "update_project",
    projectId,
    diff: diffProject(before, update),
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  revalidatePublicRoutes(before.slug, Array.from(new Set([before.area, data.area])));

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
  if (!isUuid(projectId)) return { ok: false };

  const project = await queryOne<Pick<Project, "slug" | "area">>("select slug, area from projects where id = @id", {
    id: projectId,
  });
  if (!project) return { ok: false };

  try {
    await updateRowById("projects", projectId, {
      is_published: isPublished,
      updated_by: actor.email,
      updated_at: new Date(),
    });
  } catch (error) {
    console.error("togglePublish failed:", error);
    return { ok: false };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: isPublished ? "publish_project" : "unpublish_project",
    projectId,
  });

  revalidatePath("/admin/projects");
  revalidatePublicRoutes(project.slug, [project.area]);
  return { ok: true };
}
