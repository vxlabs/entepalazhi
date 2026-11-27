"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { NOW, execute, isUuid, queryOne } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePublicRoutes } from "@/lib/revalidate";
import { timelineEntrySchema } from "@/lib/schemas";

export type TimelineFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** A timeline entry can change an issue's status, its latest-update line on
 * list cards and the home page stats, so every public route is refreshed,
 * not only the issue's own page. */
async function revalidateProjectRoutes(projectId: string, slug: string) {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  const project = await queryOne<{ area: string }>("select area from projects where id = @id", { id: projectId });
  revalidatePublicRoutes(slug, project ? [project.area] : []);
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
  if (!isUuid(projectId)) return { status: "error", message: "Could not save the update." };

  const data = parsed.data;
  try {
    await execute(
      `insert into project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after, source_url)
       values (@project_id, @happened_on, @title_en, @title_ml, @body_en, @body_ml, @status_after, @source_url)`,
      {
        project_id: projectId,
        happened_on: data.happened_on,
        title_en: data.title_en,
        title_ml: data.title_ml ?? null,
        body_en: data.body_en ?? null,
        body_ml: data.body_ml ?? null,
        status_after: data.status_after ?? null,
        source_url: data.source_url ?? null,
      },
    );

    // A timeline entry that names a new status moves the issue's own
    // status forward too. Moving to "completed" also records the resolved
    // date (the entry's date) if none is set, since the day counter and the
    // home page "Resolved" count both rely on it. The date is only used
    // when it is not before the reported date (the table refuses that);
    // otherwise it is left for the admin to fill in. Moving to any other
    // status means the issue is open again, so the resolved date is cleared.
    if (data.status_after) {
      await execute(
        `update projects
            set status = @status,
                resolved_on = case
                  when @status <> 'completed' then null
                  when resolved_on is not null then resolved_on
                  when @happened_on >= coalesce(reported_on, submitted_on) then @happened_on
                  else null
                end,
                updated_at = ${NOW}, updated_by = @actor
          where id = @id`,
        { id: projectId, status: data.status_after, happened_on: data.happened_on, actor: actor.email },
      );
    }
  } catch (error) {
    console.error("addTimelineEntry failed:", error);
    return { status: "error", message: "Could not save the update." };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "add_timeline_entry",
    projectId,
    diff: { title_en: data.title_en, status_after: data.status_after },
  });

  await revalidateProjectRoutes(projectId, slug);
  return { status: "success" };
}

export async function deleteTimelineEntry(entryId: string, projectId: string, slug: string): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  if (!isUuid(entryId) || !isUuid(projectId)) return { ok: false };

  try {
    await execute("delete from project_updates where id = @id and project_id = @project_id", {
      id: entryId,
      project_id: projectId,
    });
  } catch (error) {
    console.error("deleteTimelineEntry failed:", error);
    return { ok: false };
  }

  await writeAuditLog({ actorEmail: actor.email, action: "delete_timeline_entry", projectId, diff: { entryId } });
  await revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}
