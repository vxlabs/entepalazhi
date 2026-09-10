import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminAuthSessionCookie } from "@/lib/supabase/auth-cookies";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * Next 16 renamed the `middleware.ts` file convention to `proxy.ts`
 * (node_modules/next/dist/docs/.../file-conventions/proxy.md) - the Phase
 * 2 plan's "middleware.ts" references map to this file.
 *
 * This is an *optimistic* check only: it looks for the presence of a
 * Supabase auth cookie, not its validity, per Next's own guidance on
 * Proxy (avoid a DB/auth-server round trip here since Proxy runs on every
 * request, including prefetches). A present-but-expired-or-forged cookie
 * still gets redirected to /admin/login by requireAdminPage(), and every
 * admin server action independently calls requireAdmin() - that is the
 * real authorization boundary (see lib/auth.ts). A Server Function is
 * reachable as a direct POST to its route regardless of this matcher, so
 * this file exists purely to avoid flashing admin UI before the real
 * check runs, not to secure anything.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/auth/")) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => isAdminAuthSessionCookie(cookie.name));

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", getRequestOrigin(request)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
