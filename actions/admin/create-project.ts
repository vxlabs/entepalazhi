"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { projectEditSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import type { ProjectFormState } from "@/actions/admin/update-project";

function validationError(): ProjectFormState {
  return { status: "error", message: "Please fix the highlighted fields." };
}

/** Creates a creator-owned draft. Publishing, photos, and timeline entries
 * deliberately happen in the established editor once the project has an ID. */
export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const actor = await requireAdmin();
  const parsed = projectEditSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const state = validationError();
    state.fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!state.fieldErrors[key]) state.fieldErrors[key] = issue.message;
    }
    return state;
  }

  const data = parsed.data;
  const project = {
    slug: `${slugify(data.name_en)}-${randomUUID().slice(0, 6)}`,
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
    source: "creator" as const,
    is_published: false,
  };

  const supabase = createAdminClient();
  const { data: created, error } = await supabase.from("projects").insert(project).select("id").single();
  if (error || !created) return { status: "error", message: "Could not create the project." };

  await writeAuditLog({ actorEmail: actor.email, action: "create_project", projectId: created.id, diff: project });
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${created.id}?created=1`);
}
