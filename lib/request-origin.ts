import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

/**
 * Next dev may normalize request.url to localhost even when the browser used
 * 127.0.0.1. Redirects involved in cookie flows must retain the actual host
 * that received the request, otherwise host-only cookies disappear.
 */
export function getRequestOrigin(request: NextRequest): string {
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host"));
  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    request.nextUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

