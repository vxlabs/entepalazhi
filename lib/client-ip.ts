import "server-only";
import { createHash } from "node:crypto";

function getSalt(): string {
  // Optional: without it hashes are still one-way, just not keyed to this
  // deployment.
  return process.env.IP_HASH_SALT ?? "entepalazhi";
}

/**
 * One-way hash of a visitor's IP address, used for the daily rate limits
 * and stored beside a submitted report (project_submitters.ip_hash) so
 * repeated spam from one source can be recognised. The address itself is
 * never stored.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`ip|${ip}|${getSalt()}`).digest("hex");
}

/** Best-effort client IP from the reverse proxy's headers. */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
