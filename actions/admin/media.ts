"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

function revalidateProjectRoutes(projectId: string, slug: string) {
  revalidatePath(`/admin/projects/${projectId}`);
  for (const locale of ["en", "ml"]) revalidatePath(`/${locale}/projects/${slug}`);
}

/** Attaches an already-uploaded (via createAdminPhotoUploadUrl) photo to a
 * project. Separate from the big editor save so a photo lands as soon as
 * it finishes uploading, not only when the rest of the form is submitted. */
export async function addProjectPhoto(
  projectId: string,
  slug: string,
  storagePath: string,
): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await supabase
    .from("project_media")
    .insert({ project_id: projectId, storage_path: storagePath, sort_order: count ?? 0 });
  if (error) return { ok: false };

  await writeAuditLog({ actorEmail: actor.email, action: "add_project_photo", projectId, diff: { storagePath } });
  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}

export async function updatePhotoCaption(
  mediaId: string,
  projectId: string,
  slug: string,
  captionEn: string,
  captionMl: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("project_media")
    .update({ caption_en: captionEn || null, caption_ml: captionMl || null })
    .eq("id", mediaId);
  if (error) return { ok: false };

  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}

export async function reorderPhotos(
  projectId: string,
  slug: string,
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const supabase = createAdminClient();

  await Promise.all(
    orderedIds.map((id, sort_order) => supabase.from("project_media").update({ sort_order }).eq("id", id)),
  );

  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}

/** No hard deletes anywhere else in this app, but a photo is not a claim -
 * removing one that's blurry or wrong doesn't erase the project's record,
 * so this deletes the row and the storage object outright. */
export async function removeProjectPhoto(
  mediaId: string,
  storagePath: string,
  projectId: string,
  slug: string,
): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("project_media").delete().eq("id", mediaId);
  if (error) return { ok: false };

  await supabase.storage.from("project-photos").remove([storagePath]);
  await writeAuditLog({ actorEmail: actor.email, action: "remove_project_photo", projectId, diff: { storagePath } });
  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}
