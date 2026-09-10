"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { timelineEntrySchema } from "@/lib/schemas";

export type TimelineFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function revalidateProjectRoutes(projectId: string, slug: string) {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  for (const locale of ["en", "ml"]) revalidatePath(`/${locale}/projects/${slug}`);
}

export async function addTimelineEntry(
  projectId: string,
  slug: string,
  _prevState: TimelineFormState,
  formData: FormData,
): Promise<TimelineFormState> {
  const actor = await requireAdmin();
  const parsed = timelineEntrySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = createAdminClient();
  const data = parsed.data;

  const { error } = await supabase.from("project_updates").insert({
    project_id: projectId,
    happened_on: data.happened_on,
    title_en: data.title_en,
    title_ml: data.title_ml ?? null,
    body_en: data.body_en ?? null,
    body_ml: data.body_ml ?? null,
    status_after: data.status_after ?? null,
    source_url: data.source_url ?? null,
  });
  if (error) return { status: "error", message: "Could not save the update." };

  // A timeline entry that names a new status drives the project's own
  // status forward too, per the plan ("status_after drives project status").
  if (data.status_after) {
    await supabase.from("projects").update({ status: data.status_after }).eq("id", projectId);
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "add_timeline_entry",
    projectId,
    diff: { title_en: data.title_en, status_after: data.status_after },
  });

  revalidateProjectRoutes(projectId, slug);
  return { status: "success" };
}

export async function deleteTimelineEntry(entryId: string, projectId: string, slug: string): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("project_updates").delete().eq("id", entryId);
  if (error) return { ok: false };

  await writeAuditLog({ actorEmail: actor.email, action: "delete_timeline_entry", projectId, diff: { entryId } });
  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}
