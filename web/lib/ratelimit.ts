import "server-only";
import { query, queryOne } from "@/lib/db";
import { todayIsoInIST } from "@/lib/dates";

const MAX_SUBMISSIONS_PER_IP_PER_DAY = 5;
const MAX_UPLOADS_PER_IP_PER_DAY = 40;
const MAX_FAILED_LOGINS_PER_IP_PER_DAY = 10;

/** Adds one to today's counter for `bucket` and returns the new total.
 * A single upsert statement, so two simultaneous requests cannot both
 * read the old value. */
async function increment(bucket: string): Promise<number> {
  const rows = await query<{ hits: number }>(
    `insert into rate_limit (bucket, day_on, hits) values (@bucket, @day, 1)
     on conflict (bucket, day_on) do update set hits = hits + 1
     returning hits`,
    { bucket, day: todayIsoInIST() },
  );
  return rows[0]?.hits ?? 1;
}

async function current(bucket: string): Promise<number> {
  const row = await queryOne<{ hits: number }>(
    "select hits from rate_limit where bucket = @bucket and day_on = @day",
    { bucket, day: todayIsoInIST() },
  );
  return row?.hits ?? 0;
}

/**
 * Spam control for the public report form (after the honeypot field): a
 * per-IP daily counter. Returns true while the caller is within the limit.
 */
export async function checkSubmissionRateLimit(ipHash: string): Promise<boolean> {
  return (await increment(`submit:${ipHash}`)) <= MAX_SUBMISSIONS_PER_IP_PER_DAY;
}

/** The public photo upload endpoint. A report carries at most 6 photos, so
 * this covers the daily report allowance with room for retries. */
export async function checkUploadRateLimit(ipHash: string): Promise<boolean> {
  return (await increment(`upload:${ipHash}`)) <= MAX_UPLOADS_PER_IP_PER_DAY;
}

/** True while this address may still attempt an admin sign-in today. */
export async function canAttemptLogin(ipHash: string): Promise<boolean> {
  return (await current(`login:${ipHash}`)) < MAX_FAILED_LOGINS_PER_IP_PER_DAY;
}

export async function recordFailedLogin(ipHash: string): Promise<void> {
  await increment(`login:${ipHash}`);
}
