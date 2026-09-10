"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function safeExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

export type SignedUploadResult = { bucket: string; path: string; signedUrl: string; token: string };

/**
 * Mints a short-lived signed upload URL so the client can PUT a photo
 * straight to Supabase Storage, bypassing this Next.js version's 1MB
 * default Server Action body limit and Vercel's platform request-body cap
 * - both well under a phone photo. Client-side compression
 * (browser-image-compression) happens before this is called, to protect
 * the 1GB free-tier storage budget.
 *
 * Public submissions land in the private `pending-photos` bucket, held
 * for moderation - no auth required to call this (the /report form is
 * public), but the destination bucket has no public-read policy, so an
 * unmoderated photo is never reachable by URL guess.
 */
export async function createPublicPhotoUploadUrl(fileName: string): Promise<SignedUploadResult> {
  const supabase = createAdminClient();
  const path = `submissions/${randomUUID()}.${safeExtension(fileName)}`;

  const { data, error } = await supabase.storage.from("pending-photos").createSignedUploadUrl(path);
  if (error) throw error;

  return { bucket: "pending-photos", path, signedUrl: data.signedUrl, token: data.token };
}

/**
 * Same signed-URL path for the admin editor, but straight into the public
 * `project-photos` bucket - admin's own uploads don't need moderation.
 * Gated by requireAdmin() since, unlike the public form, there's no other
 * reason this endpoint should be reachable.
 */
export async function createAdminPhotoUploadUrl(projectId: string, fileName: string): Promise<SignedUploadResult> {
  await requireAdmin();

  const supabase = createAdminClient();
  const path = `${projectId}/${randomUUID()}.${safeExtension(fileName)}`;

  const { data, error } = await supabase.storage.from("project-photos").createSignedUploadUrl(path);
  if (error) throw error;

  return { bucket: "project-photos", path, signedUrl: data.signedUrl, token: data.token };
}
