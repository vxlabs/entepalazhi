import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSeenFingerprint, getClientIp } from "@/lib/fingerprint";

const bodySchema = z.object({ project_id: z.uuid() });

/**
 * One click, no login, no PII. The unique constraint on
 * (project_id, fingerprint) absorbs repeats; record_seen_confirmation()
 * increments projects.seen_count only on a genuinely new fingerprint - see
 * supabase/migrations/0002_admin.sql.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent") ?? "";
  const fingerprint = computeSeenFingerprint(ip, userAgent);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("record_seen_confirmation", {
      p_project_id: parsed.data.project_id,
      p_fingerprint: fingerprint,
    })
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not record this." }, { status: 500 });
  }

  const result = data as { seen_count: number; already_seen: boolean };
  return NextResponse.json({ seenCount: result.seen_count, alreadySeen: result.already_seen });
}
