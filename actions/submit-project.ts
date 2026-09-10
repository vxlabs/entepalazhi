"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { submissionSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSubmissionRateLimit } from "@/lib/ratelimit";
import { getClientIp, hashIp } from "@/lib/fingerprint";
import { parseMapsPin } from "@/lib/maps";
import { slugify } from "@/lib/utils";

export type SubmitProjectState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Env-gated: absent, the app skips Turnstile entirely, so handover works
  // with only Supabase + Vercel accounts (no Cloudflare account required).
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

export async function submitProject(
  _prevState: SubmitProjectState,
  formData: FormData,
): Promise<SubmitProjectState> {
  // Spam control #1 (free): honeypot. A real visitor never fills this in -
  // it's visually hidden from sighted users and skipped by screen readers.
  // Pretend success so a bot doesn't learn to look elsewhere.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { status: "success" };
  }

  const raw = Object.fromEntries(formData.entries());
  const photoPaths = formData.getAll("photo_paths").filter((v): v is string => typeof v === "string");
  const parsed = submissionSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const ipHash = hashIp(ip);

  // Spam control #2: Postgres-tracked IP rate limit.
  const withinLimit = await checkSubmissionRateLimit(ipHash);
  if (!withinLimit) {
    return { status: "error", message: "Too many submissions from this connection today. Try again tomorrow." };
  }

  // Spam control #3 (optional): Cloudflare Turnstile, only if configured.
  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response") as string | null, ip);
  if (!turnstileOk) {
    return { status: "error", message: "Verification failed. Please try again." };
  }

  const data = parsed.data;
  const pin = data.latitude != null && data.longitude != null
    ? { latitude: data.latitude, longitude: data.longitude }
    : data.maps_url ? await parseMapsPin(data.maps_url) : null;

  const supabase = createAdminClient();
  const slug = `${slugify(data.name_en)}-${randomUUID().slice(0, 6)}`;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      slug,
      name_en: data.name_en,
      description_en: data.description_en ?? null,
      district: data.district,
      local_body: data.local_body ?? null,
      department: data.department ?? null,
      latitude: pin?.latitude ?? null,
      longitude: pin?.longitude ?? null,
      source: "public",
      status: "lead",
      is_published: false,
    })
    .select("id, slug")
    .single();

  if (projectError || !project) {
    return { status: "error", message: "Could not save your report. Please try again." };
  }

  const { error: submitterError } = await supabase.from("project_submitters").insert({
    project_id: project.id,
    name: data.submitter_name ?? null,
    email: data.submitter_email || null,
    phone: data.submitter_phone ?? null,
    note: data.submitter_note ?? null,
    ip_hash: ipHash,
    pending_photo_paths: photoPaths,
  });

  if (submitterError) {
    console.error("Failed to save project_submitters row:", submitterError);
  }

  return { status: "success" };
}
