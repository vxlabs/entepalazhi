import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/session-cookie";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * Next 16 renamed the `middleware.ts` file convention to `proxy.ts`
 * (node_modules/next/dist/docs/.../file-conventions/proxy.md).
 *
 * This is an *optimistic* check only: it looks for the presence of the
 * admin session cookie, not its validity (no database round trip here,
 * since Proxy runs on every /admin request, including prefetches). A
 * present-but-expired-or-forged cookie still gets redirected to
 * /admin/login by requireAdminPage(), and every admin server action and
 * route handler independently checks the session - that is the real
 * authorization boundary (see lib/auth.ts). This file exists purely to
 * avoid flashing admin UI before the real check runs.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", getRequestOrigin(request)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
