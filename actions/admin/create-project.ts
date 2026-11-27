"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { insertRow } from "@/lib/db";
import { projectEditSchema } from "@/lib/schemas";
import { slugify } from "@/lib/utils";
import type { ProjectFormState } from "@/actions/admin/update-project";

function validationError(): ProjectFormState {
  return { status: "error", message: "Please fix the highlighted fields." };
}

/** Creates an admin-owned draft. Publishing, photos, and timeline entries
 * deliberately happen in the editor once the issue has an ID. */
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
    state.values = Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    return state;
  }

  const data = parsed.data;
  const project = {
    slug: `${slugify(data.name_en)}-${randomUUID().slice(0, 6)}`,
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
    source: "admin" as const,
    is_published: false,
  };

  let createdId: string;
  try {
    createdId = await insertRow("projects", { ...project, updated_by: actor.email });
  } catch (error) {
    console.error("createProject failed:", error);
    return { status: "error", message: "Could not create the issue. Check the dates: resolved cannot be before reported.", values: Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string")) };
  }

  await writeAuditLog({ actorEmail: actor.email, action: "create_project", projectId: createdId, diff: project });
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${createdId}?created=1`);
}
