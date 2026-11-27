import { readPublicPhoto } from "@/lib/uploads";

/**
 * Serves approved photos from UPLOAD_DIR/public. File names are random and
 * never reused, so responses can be cached for a long time. Only paths of
 * the exact shape the app generates are accepted (see lib/uploads.ts), so
 * this cannot be used to read anything else from disk.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const photo = await readPublicPhoto(path.join("/"));
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
