/**
 * Name and scope of the admin session cookie. Kept free of server-only
 * imports because proxy.ts reads the name too.
 *
 * Scoped to /admin so it is never sent with public pages or static assets;
 * every admin page, server action and admin route handler lives under that
 * path.
 */
export const ADMIN_SESSION_COOKIE = "entepalazhi-admin";
export const ADMIN_SESSION_PATH = "/admin";
export const ADMIN_SESSION_DAYS = 30;
