/**
 * Admin authentication is confined to /admin, so keep its cookies out of
 * public pages and Next's static assets. A project-specific name also avoids
 * the generic `sb-127-auth-token` namespace used by local Supabase projects.
 */
export const ADMIN_AUTH_COOKIE_NAME = "aarekettikkan-admin-auth";

export const ADMIN_AUTH_COOKIE_OPTIONS = {
  name: ADMIN_AUTH_COOKIE_NAME,
  path: "/admin",
} as const;

/** Matches the base cookie and Supabase's numbered session-cookie chunks. */
export function isAdminAuthSessionCookie(name: string): boolean {
  if (name === ADMIN_AUTH_COOKIE_NAME) return true;

  const chunkPrefix = `${ADMIN_AUTH_COOKIE_NAME}.`;
  return name.startsWith(chunkPrefix) && /^\d+$/.test(name.slice(chunkPrefix.length));
}
