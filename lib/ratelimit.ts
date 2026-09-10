import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SUBMISSIONS_PER_IP_PER_DAY = 5;

/**
 * Cheapest-to-most-expensive spam control #2 (after the honeypot field):
 * a Postgres-tracked per-IP daily counter. Returns true when the caller is
 * still within the limit. See check_and_increment_rate_limit() in
 * supabase/migrations/0002_admin.sql for the atomic upsert-and-check.
 */
export async function checkSubmissionRateLimit(ipHash: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
    p_ip_hash: ipHash,
    p_max_per_day: MAX_SUBMISSIONS_PER_IP_PER_DAY,
  });
  if (error) throw error;
  return Boolean(data);
}
