import { NextResponse } from "next/server";
import { getClientIp, hashIp } from "@/lib/client-ip";
import { checkUploadRateLimit } from "@/lib/ratelimit";
import { savePendingPhoto } from "@/lib/uploads";

/**
 * Photo upload for the public report form. Open to anyone (the form is
 * public), so: rate-limited per IP, size-capped, image type checked from
 * the file's own bytes, and written to the pending folder - which nothing
 * serves. A photo only becomes reachable after an admin accepts the report.
 */
export async function POST(request: Request) {
  const ipHash = hashIp(getClientIp(request.headers));
  if (!(await checkUploadRateLimit(ipHash))) {
    return NextResponse.json({ error: "Too many uploads today." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }

  const saved = await savePendingPhoto(file);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json({ path: saved.path });
}
