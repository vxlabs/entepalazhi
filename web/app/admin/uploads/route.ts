import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth";
import { isUuid, queryOne } from "@/lib/db";
import { savePublicPhoto } from "@/lib/uploads";

/**
 * Photo upload from the admin editor: straight into the public folder,
 * since an admin's own photos need no review. Lives under /admin so the
 * session cookie (scoped to that path) is sent with it.
 */
export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const projectId = form?.get("projectId");
  if (!(file instanceof File) || !isUuid(projectId)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const project = await queryOne<{ id: string }>("select id from projects where id = @id", { id: projectId });
  if (!project) return NextResponse.json({ error: "Unknown issue." }, { status: 404 });

  const saved = await savePublicPhoto(project.id, file);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json({ path: saved.path });
}
