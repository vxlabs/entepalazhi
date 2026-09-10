/** Builds a public URL for an approved photo in the `project-photos`
 * bucket from its stored path. See supabase/migrations/0001_core.sql for
 * why `project_media.storage_path` is a path, not a full URL - it has to
 * survive a bucket rename/migration without a data rewrite. */
export function getPublicPhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return storagePath;
  return `${base}/storage/v1/object/public/project-photos/${storagePath}`;
}
