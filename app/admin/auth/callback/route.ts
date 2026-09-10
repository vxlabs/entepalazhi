import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createAuthServerClient,
  type AuthCookieToSet,
} from "@/lib/supabase/auth-server";
import { getRequestOrigin } from "@/lib/request-origin";

type AuthErrorState = "context" | "expired" | "exchange";

const CONTEXT_ERROR_CODES = new Set([
  "bad_code_verifier",
  "pkce_code_verifier_not_found",
]);

function withAuthCookies(response: NextResponse, cookieUpdates: Map<string, AuthCookieToSet>) {
  for (const { name, value, options } of cookieUpdates.values()) {
    response.cookies.set(name, value, options);
  }
  return response;
}

function loginRedirect(
  request: NextRequest,
  authError: AuthErrorState,
  cookieUpdates: Map<string, AuthCookieToSet>,
) {
  const url = new URL("/admin/login", getRequestOrigin(request));
  url.searchParams.set("auth_error", authError);
  return withAuthCookies(NextResponse.redirect(url), cookieUpdates);
}

/**
 * Exchanges the magic-link's PKCE code for a session, writing the auth
 * cookies via the Route Handler's writable cookies() (see
 * lib/supabase/auth-server.ts). This is the only place that establishes a
 * session; requireAdminPage()/requireAdmin() still gate everything past
 * this point against ADMIN_EMAILS.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const cookieUpdates = new Map<string, AuthCookieToSet>();

  if (code) {
    const supabase = await createAuthServerClient({
      onCookiesSet(cookiesToSet) {
        for (const cookie of cookiesToSet) cookieUpdates.set(cookie.name, cookie);
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error) {
      return withAuthCookies(
        NextResponse.redirect(new URL("/admin", getRequestOrigin(request))),
        cookieUpdates,
      );
    }

    if (error.code && CONTEXT_ERROR_CODES.has(error.code)) {
      return loginRedirect(request, "context", cookieUpdates);
    }

    return loginRedirect(request, "exchange", cookieUpdates);
  }

  // GoTrue redirects here with these parameters when its one-time token was
  // already consumed, expired, or otherwise invalid. Do not surface its raw
  // description in the UI.
  const errorCode = request.nextUrl.searchParams.get("error_code");
  return loginRedirect(
    request,
    errorCode === "otp_expired" ? "expired" : "exchange",
    cookieUpdates,
  );
}
