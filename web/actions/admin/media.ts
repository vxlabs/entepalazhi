"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { execute, isUuid, queryOne } from "@/lib/db";
import { deletePublicPhoto, isPublicPath } from "@/lib/uploads";
import { writeAuditLog } from "@/lib/audit";

function revalidateProjectRoutes(projectId: string, slug: string) {
  revalidatePath(`/admin/projects/${projectId}`);
  for (const locale of ["en", "ml"]) revalidatePath(`/${locale}/issues/${slug}`);
}

/** Attaches an already-uploaded photo (POST /admin/uploads) to an issue.
 * Separate from the big editor save so a photo lands as soon as it
 * finishes uploading, not only when the rest of the form is submitted. */
export async function addProjectPhoto(
  projectId: string,
  slug: string,
  storagePath: string,
): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  // The path must be one this app generated, inside this issue's own folder.
  if (!isUuid(projectId) || !isPublicPath(storagePath) || !storagePath.startsWith(`${projectId.toLowerCase()}/`)) {
    return { ok: false };
  }

  try {
    const existing = await queryOne<{ n: number }>(
      "select count(*) as n from project_media where project_id = @project_id",
      { project_id: projectId },
    );
    await execute(
      "insert into project_media (project_id, storage_path, sort_order) values (@project_id, @storage_path, @sort_order)",
      { project_id: projectId, storage_path: storagePath, sort_order: existing?.n ?? 0 },
    );
  } catch (error) {
    console.error("addProjectPhoto failed:", error);
    return { ok: false };
  }

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
  if (!isUuid(mediaId)) return { ok: false };

  try {
    await execute("update project_media set caption_en = @caption_en, caption_ml = @caption_ml where id = @id", {
      id: mediaId,
      caption_en: captionEn || null,
      caption_ml: captionMl || null,
    });
  } catch (error) {
    console.error("updatePhotoCaption failed:", error);
    return { ok: false };
  }

  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}

export async function reorderPhotos(
  projectId: string,
  slug: string,
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!isUuid(projectId) || !orderedIds.every(isUuid)) return { ok: false };

  for (const [sortOrder, id] of orderedIds.entries()) {
    await execute("update project_media set sort_order = @sort_order where id = @id and project_id = @project_id", {
      id,
      project_id: projectId,
      sort_order: sortOrder,
    });
  }

  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}

/** A photo is not a claim - removing one that is blurry or wrong does not
 * erase the issue's record, so this deletes the row and the file outright.
 * The file path comes from the database row, never from the caller. */
export async function removeProjectPhoto(
  mediaId: string,
  _storagePath: string,
  projectId: string,
  slug: string,
): Promise<{ ok: boolean }> {
  const actor = await requireAdmin();
  if (!isUuid(mediaId)) return { ok: false };

  const row = await queryOne<{ storage_path: string; project_id: string }>(
    "select storage_path, project_id from project_media where id = @id",
    { id: mediaId },
  );
  if (!row) return { ok: false };

  await execute("delete from project_media where id = @id", { id: mediaId });
  await deletePublicPhoto(row.storage_path);

  await writeAuditLog({
    actorEmail: actor.email,
    action: "remove_project_photo",
    projectId: row.project_id,
    diff: { storagePath: row.storage_path },
  });
  revalidateProjectRoutes(projectId, slug);
  return { ok: true };
}
