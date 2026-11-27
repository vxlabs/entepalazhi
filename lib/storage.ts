/** Public URL of an approved photo. `storagePath` is what is stored in
 * project_media.storage_path: a path relative to UPLOAD_DIR/public, served
 * by app/media/[...path]/route.ts. Safe to import from client components. */
export function getPublicPhotoUrl(storagePath: string): string {
  return `/media/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}
