"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { SUBMISSION_ERRORS, submissionSchema, type SubmissionError } from "@/lib/schemas";
import { execute, insertRow } from "@/lib/db";
import { checkSubmissionRateLimit } from "@/lib/ratelimit";
import { getClientIp, hashIp } from "@/lib/client-ip";
import { isPendingPath } from "@/lib/uploads";
import { slugify } from "@/lib/utils";
import { DEFAULT_LOCAL_BODY } from "@/lib/areas";

/**
 * Errors travel as codes (see SUBMISSION_ERRORS); the form turns them into
 * sentences in the reader's language. `values` echoes back what was typed,
 * because React clears a form's fields once its action has run.
 */
export type SubmitProjectState = {
  status: "idle" | "success" | "error";
  message?: SubmissionError;
  fieldErrors?: Record<string, SubmissionError>;
  values?: Record<string, string>;
};

const MAX_PHOTOS = 3;

/** Stored for every public report; the area is chosen in the admin editor
 * when the report is accepted. */
const UNSORTED_AREA = "other";

const isSubmissionError = (value: string): value is SubmissionError =>
  (SUBMISSION_ERRORS as readonly string[]).includes(value);

/** The typed text fields, to refill the form after an error. */
function typedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of ["name_en", "description_en", "ward_no", "submitter_phone"]) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Optional: when the secret is not set, Turnstile is skipped entirely.
  if (!secret) return true;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const result = (await response.json()) as { success: boolean };
    return result.success;
  } catch {
    return false;
  }
}

/**
 * A report from the public form. It is saved unpublished (a "lead") and
 * shows up only in the admin review queue; nothing a visitor sends is
 * visible on the site until an admin has checked and published it.
 */
export async function submitProject(
  _prevState: SubmitProjectState,
  formData: FormData,
): Promise<SubmitProjectState> {
  // Spam control #1 (free): honeypot. A real visitor never fills this in -
  // it is visually hidden and skipped by screen readers. Pretend success
  // so a bot does not learn to look elsewhere.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { status: "success" };
  }

  const raw = Object.fromEntries(formData.entries());
  // Only paths the upload endpoint itself could have produced are kept.
  const photoPaths = formData
    .getAll("photo_paths")
    .filter((v): v is string => typeof v === "string" && isPendingPath(v))
    .slice(0, MAX_PHOTOS);
  const parsed = submissionSchema.safeParse(raw);

  const values = typedValues(formData);

  const fieldErrors: Record<string, SubmissionError> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = isSubmissionError(issue.message) ? issue.message : "generic";
    }
  }
  // A report needs at least one photo: with no contact details required, the
  // photograph is what lets it be checked.
  if (photoPaths.length === 0) fieldErrors.photo_paths = "photo_missing";

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "generic", fieldErrors, values };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const ipHash = hashIp(ip);

  // Spam control #2: per-IP daily limit.
  const withinLimit = await checkSubmissionRateLimit(ipHash);
  if (!withinLimit) {
    return { status: "error", message: "rate_limited", values };
  }

  // Spam control #3 (optional): Cloudflare Turnstile, only if configured.
  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) {
    return { status: "error", message: "verification_failed", values };
  }

  const data = parsed.data;

  let projectId: string;
  try {
    projectId = await insertRow("projects", {
      // slugify() keeps ASCII only, so a title typed in Malayalam leaves
      // nothing behind - hence the fallback word.
      slug: `${slugify(data.name_en) || "issue"}-${randomUUID().slice(0, 6)}`,
      name_en: data.name_en,
      description_en: data.description_en,
      area: UNSORTED_AREA,
      local_body: DEFAULT_LOCAL_BODY,
      ward_no: data.ward_no,
      latitude: data.latitude,
      longitude: data.longitude,
      source: "public",
      status: "lead",
      is_published: false,
    });
  } catch (error) {
    console.error("submitProject failed:", error);
    return { status: "error", message: "save_failed", values };
  }

  // The form asks for a mobile number only; the name, email and note columns
  // remain for reports sent before that change.
  try {
    await execute(
      `insert into project_submitters (project_id, phone, ip_hash, pending_photo_paths)
       values (@project_id, @phone, @ip_hash, @pending_photo_paths)`,
      {
        project_id: projectId,
        phone: data.submitter_phone ?? null,
        ip_hash: ipHash,
        pending_photo_paths: JSON.stringify(photoPaths),
      },
    );
  } catch (error) {
    console.error("Failed to save project_submitters row:", error);
  }

  return { status: "success" };
}
