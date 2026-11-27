import "server-only";
import { createHash } from "node:crypto";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getSecret(): string {
  // Falls back to the service-role key so a dedicated FINGERPRINT_SECRET
  // isn't required for handover - it's already a private, per-project
  // secret that's never sent to the client.
  return process.env.FINGERPRINT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "aarekettikkan";
}

/** UTC calendar day, used to rotate the "seen" fingerprint salt daily. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * "I've seen this too" fingerprint: SHA-256 of IP + user-agent + a
 * daily-rotating salt. Rotating the salt means the stored fingerprint
 * cannot be correlated across days - see supabase/migrations/0002_admin.sql.
 * No PII stored, no login.
 */
export function computeSeenFingerprint(ip: string, userAgent: string): string {
  return sha256(`seen|${ip}|${userAgent}|${getSecret()}|${today()}`);
}

/**
 * Stable (non-rotating) IP hash for spam moderation: project_submitters.ip_hash
 * and the submission rate limit. Deliberately not day-rotated, unlike the
 * seen fingerprint above - the point here is letting admin/rate-limiting
 * recognize the same source across days, not privacy from correlation.
 */
export function hashIp(ip: string): string {
  return sha256(`ip|${ip}|${getSecret()}`);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
