import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export type AdminActor = { email: string };

function getAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifies the session with Supabase Auth (getUser(), not getSession() -
 * this round-trips to the auth server rather than trusting a locally
 * decoded cookie) and checks the email against ADMIN_EMAILS.
 *
 * cache()-wrapped so repeated calls within one request/render share a
 * single check. Returns null rather than throwing - callers decide
 * whether to redirect (pages) or reject (actions/route handlers).
 */
export const getAdminActor = cache(async (): Promise<AdminActor | null> => {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const email = data.user.email.toLowerCase();
  if (!getAllowlist().includes(email)) return null;

  return { email };
});

/** Admin pages/layouts: redirect to login if there's no authorized session. */
export async function requireAdminPage(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login");
  return actor;
}

/**
 * Every admin server action and route handler: the actual authorization
 * boundary. proxy.ts (this Next.js version's renamed middleware.ts) only
 * redirects unauthenticated browser navigations as a convenience - per
 * Next's own docs, a Server Function is a POST to whatever route defines
 * it, reachable directly regardless of proxy matchers, and a matcher
 * change can silently remove proxy coverage. This is the check that
 * cannot be bypassed by skipping the UI. Throws (rather than redirecting)
 * since actions/route handlers return responses, not React trees.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) throw new Error("Unauthorized: admin session required.");
  return actor;
}
