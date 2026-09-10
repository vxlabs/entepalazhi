import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { ADMIN_AUTH_COOKIE_OPTIONS } from "./auth-cookies";

export type AuthCookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Cookie-aware Supabase client for the admin auth session (magic link).
 *
 * Used only under app/admin - public routes keep using
 * lib/supabase/server.ts's cookie-free createAnonClient() so they stay
 * statically rendered (see that file's comment). Calling cookies() here is
 * fine because every admin route is already dynamic (a real user session
 * to check on every request).
 *
 * setAll is wrapped in try/catch per Supabase's documented Next.js
 * pattern: Server Components cannot write cookies, so a token refresh
 * triggered from one is silently dropped there. requireAdmin() is called
 * again on every server action and route handler, where cookies() is
 * writable, so a dropped refresh in a Server Component doesn't create a
 * stale-session security gap - the next mutating call re-verifies.
 */
export async function createAuthServerClient({
  onCookiesSet,
}: {
  onCookiesSet?: (cookies: AuthCookieToSet[]) => void;
} = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    auth: {
      experimental: {
        // Return the per-link flow id to the callback. It lets the callback
        // select the verifier for this link when several magic links are
        // pending at once instead of using whichever verifier was most
        // recently written to the browser.
        appendPkceFlowIdToRedirects: true,
      },
    },
    cookies: {
      // Keep only access/refresh tokens in cookies. getAdminActor() calls
      // getUser(), so it does not depend on the user object being present.
      encode: "tokens-only",
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component - no response to attach
          // Set-Cookie to. Safe to ignore; see the doc comment above.
        } finally {
          // A Route Handler that returns a separately constructed
          // NextResponse must copy these mutations to that response.
          onCookiesSet?.(cookiesToSet);
        }
      },
    },
    cookieOptions: ADMIN_AUTH_COOKIE_OPTIONS,
  });
}
