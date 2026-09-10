"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { rejectSubmissionSchema } from "@/lib/schemas";

/**
 * Approves a pending submission into the editor: moves any pending photos
 * from pending-photos into project-photos (copy + delete original, per
 * the plan - "approval copies the object across and deletes the pending
 * original"), creates the project_media rows those photos didn't have
 * yet (see the pending_photo_paths comment in 0002_admin.sql), and
 * redirects the caller to /admin/projects/[id] to enrich and publish.
 * Does NOT set is_published - that's a deliberate step in the editor.
 */
export async function approveSubmission(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireAdmin();
  const supabase = createAdminClient();

  const { data: submitter, error: submitterError } = await supabase
    .from("project_submitters")
    .select("id, pending_photo_paths")
    .eq("project_id", projectId)
    .maybeSingle();
  if (submitterError) return { ok: false, error: submitterError.message };

  const pendingPaths = submitter?.pending_photo_paths ?? [];
  const movedPaths: string[] = [];

  for (const pendingPath of pendingPaths) {
    const filename = pendingPath.split("/").pop() ?? pendingPath;
    const destPath = `${projectId}/${filename}`;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("pending-photos")
      .download(pendingPath);
    if (downloadError || !fileData) continue;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(destPath, fileData, { upsert: true });
    if (uploadError) continue;

    await supabase.storage.from("pending-photos").remove([pendingPath]);
    movedPaths.push(destPath);
  }

  if (movedPaths.length > 0) {
    const { error: mediaError } = await supabase
      .from("project_media")
      .insert(movedPaths.map((storage_path, i) => ({ project_id: projectId, storage_path, sort_order: i })));
    if (mediaError) return { ok: false, error: mediaError.message };
  }

  if (submitter) {
    await supabase.from("project_submitters").update({ pending_photo_paths: [] }).eq("id", submitter.id);
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

  const supabase = createAdminClient();
  // No hard deletes anywhere in this app - a rejected lead archives, it
  // doesn't disappear, so there's still a record if the same tip resurfaces.
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data.project_id);
  if (error) return { ok: false, error: error.message };

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
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString(), is_published: false })
    .eq("id", projectId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({ actorEmail: actor.email, action: "archive_project", projectId });

  revalidatePath("/admin/queue");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}
