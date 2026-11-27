"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { NOW, execute, isUuid, queryOne } from "@/lib/db";
import { parsePendingPhotoPaths } from "@/lib/data/admin";
import { promotePendingPhoto } from "@/lib/uploads";
import { writeAuditLog } from "@/lib/audit";
import { rejectSubmissionSchema } from "@/lib/schemas";

/**
 * Accepts a pending report into the editor: moves its photos out of the
 * private pending folder into the public one, creates the project_media
 * rows for them, and leaves the caller to open /admin/projects/[id] to
 * check the facts and publish. Does NOT publish - that stays a deliberate
 * step in the editor, so nothing a visitor sent goes public unreviewed.
 */
export async function approveSubmission(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireAdmin();
  if (!isUuid(projectId)) return { ok: false, error: "Unknown submission." };

  const submitter = await queryOne<{ id: string; pending_photo_paths: string }>(
    "select id, pending_photo_paths from project_submitters where project_id = @project_id",
    { project_id: projectId },
  );

  const movedPaths: string[] = [];
  for (const pendingPath of parsePendingPhotoPaths(submitter?.pending_photo_paths)) {
    const publicPath = await promotePendingPhoto(pendingPath, projectId);
    if (publicPath) movedPaths.push(publicPath);
  }

  try {
    const existing = await queryOne<{ n: number }>(
      "select count(*) as n from project_media where project_id = @project_id",
      { project_id: projectId },
    );
    const offset = existing?.n ?? 0;
    for (const [i, storagePath] of movedPaths.entries()) {
      await execute(
        "insert into project_media (project_id, storage_path, sort_order) values (@project_id, @storage_path, @sort_order)",
        { project_id: projectId, storage_path: storagePath, sort_order: offset + i },
      );
    }
    if (submitter) {
      await execute("update project_submitters set pending_photo_paths = '[]' where id = @id", { id: submitter.id });
    }
  } catch (error) {
    console.error("approveSubmission failed:", error);
    return { ok: false, error: "Could not accept this submission. Please try again." };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "approve_submission",
    projectId,
    diff: { movedPhotoCount: movedPaths.length },
  });

  revalidatePath("/admin/queue");
  return { ok: true };
}

export async function rejectSubmission(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireAdmin();
  const parsed = rejectSubmissionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // No hard deletes: a rejected report is archived, so there is still a
  // record if the same tip comes in again.
  try {
    await execute(
      `update projects set archived_at = ${NOW}, updated_at = ${NOW}, updated_by = @actor where id = @id`,
      { id: parsed.data.project_id, actor: actor.email },
    );
  } catch (error) {
    console.error("rejectSubmission failed:", error);
    return { ok: false, error: "Could not reject this submission." };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "reject_submission",
    projectId: parsed.data.project_id,
    diff: { reason: parsed.data.reason },
  });

  revalidatePath("/admin/queue");
  return { ok: true };
}

export async function archiveProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireAdmin();
  if (!isUuid(projectId)) return { ok: false, error: "Unknown issue." };

  try {
    await execute(
      `update projects
          set archived_at = ${NOW}, is_published = 0,
              updated_at = ${NOW}, updated_by = @actor
        where id = @id`,
      { id: projectId, actor: actor.email },
    );
  } catch (error) {
    console.error("archiveProject failed:", error);
    return { ok: false, error: "Could not archive this issue." };
  }

  await writeAuditLog({ actorEmail: actor.email, action: "archive_project", projectId });

  revalidatePath("/admin/queue");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}
