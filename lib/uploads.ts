import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Photo storage on the server's own disk.
 *
 *   UPLOAD_DIR/pending/submissions/<uuid>.webp   sent with a public report,
 *                                                not reachable from the web
 *   UPLOAD_DIR/public/<project id>/<uuid>.webp   approved, served at /media/...
 *
 * Two separate trees, so an unreviewed photo cannot be reached by guessing
 * a URL: nothing serves the pending tree at all.
 *
 * Every photo is re-encoded as WebP before it is written (see toWebp), so
 * the disk and the backups hold small files whatever the phone sent. Photos
 * stored before that still carry .jpg / .png names, which stay valid.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Keep in step with scripts/convert-photos-to-webp.mjs.
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 80;

const EXTENSION_BY_SIGNATURE: { ext: string; mime: string; matches: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    mime: "image/png",
    matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    mime: "image/webp",
    matches: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const FILE_NAME = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(?:jpg|png|webp)";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PENDING_PATH = new RegExp(`^submissions/${FILE_NAME}$`);
const PUBLIC_PATH = new RegExp(`^${UUID}/${FILE_NAME}$`);

function root(): string {
  // The upload folder is deliberately outside the app bundle (a mounted
  // volume in production), so tell the bundler not to trace it.
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./uploads");
}

/** Paths arrive from forms and URLs. Only the exact shapes this module
 * itself generates are accepted, which also rules out "../" traversal. */
export function isPendingPath(value: string): boolean {
  return PENDING_PATH.test(value);
}

export function isPublicPath(value: string): boolean {
  return PUBLIC_PATH.test(value);
}

/** Works out the real image type from the file's first bytes; the name and
 * content-type the browser sent are not trusted. */
function detect(bytes: Buffer) {
  return EXTENSION_BY_SIGNATURE.find((type) => type.matches(bytes)) ?? null;
}

/** Re-encodes a photo as WebP, no larger than MAX_DIMENSION on its long
 * side. The phone's rotation flag is applied to the pixels first, and all
 * other metadata - including any GPS position - is left behind. Returns
 * null when the bytes are not an image that can actually be decoded. */
async function toWebp(bytes: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(bytes)
      .autoOrient()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}

export type SaveResult = { ok: true; path: string } | { ok: false; error: string };

async function save(tree: "pending" | "public", folder: string, file: File): Promise<SaveResult> {
  if (file.size === 0) return { ok: false, error: "Empty file." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Photo is too large." };

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detect(bytes)) return { ok: false, error: "Only JPEG, PNG or WebP photos are accepted." };

  const webp = await toWebp(bytes);
  if (!webp) return { ok: false, error: "Could not read that photo." };

  const relative = `${folder}/${randomUUID()}.webp`;
  const absolute = path.join(root(), tree, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, webp);
  return { ok: true, path: relative };
}

export function savePendingPhoto(file: File): Promise<SaveResult> {
  return save("pending", "submissions", file);
}

export function savePublicPhoto(projectId: string, file: File): Promise<SaveResult> {
  return save("public", projectId.toLowerCase(), file);
}

/** Moves an approved photo out of the pending tree. Returns its new public
 * path, or null if the file is missing or the path is not one of ours. */
export async function promotePendingPhoto(pendingPath: string, projectId: string): Promise<string | null> {
  if (!isPendingPath(pendingPath)) return null;

  const fileName = pendingPath.split("/").pop() as string;
  const publicPath = `${projectId.toLowerCase()}/${fileName}`;
  const from = path.join(root(), "pending", pendingPath);
  const to = path.join(root(), "public", publicPath);

  try {
    await mkdir(path.dirname(to), { recursive: true });
    try {
      await rename(from, to);
    } catch {
      // rename() fails across volumes; fall back to copy + delete.
      await copyFile(from, to);
      await rm(from, { force: true });
    }
    return publicPath;
  } catch {
    return null;
  }
}

export async function deletePendingPhoto(pendingPath: string): Promise<void> {
  if (!isPendingPath(pendingPath)) return;
  await rm(path.join(root(), "pending", pendingPath), { force: true });
}

export async function deletePublicPhoto(publicPath: string): Promise<void> {
  if (!isPublicPath(publicPath)) return;
  await rm(path.join(root(), "public", publicPath), { force: true });
}

export async function readPublicPhoto(publicPath: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!isPublicPath(publicPath)) return null;
  try {
    const bytes = await readFile(path.join(root(), "public", publicPath));
    const ext = publicPath.split(".").pop() ?? "";
    return { bytes, mime: MIME_BY_EXT[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
