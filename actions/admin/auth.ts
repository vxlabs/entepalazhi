"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { SITE_CONFIG } from "@/lib/site-config";

export type SendMagicLinkState = { status: "idle" | "sent" | "error"; message?: string };

const emailSchema = z.email({ error: "Enter a valid email." });

async function getMagicLinkCallbackUrl(): Promise<string> {
  const origin = (await headers()).get("origin");

  if (origin) {
    try {
      const requestUrl = new URL(origin);
      if (requestUrl.protocol === "http:" || requestUrl.protocol === "https:") {
        return new URL("/admin/auth/callback", requestUrl).toString();
      }
    } catch {
      // Fall back to the configured canonical URL for non-browser requests.
    }
  }

  return `${SITE_CONFIG.siteUrl}/admin/auth/callback`;
}

/**
 * Sends a Supabase magic link (email OTP) - no password to lose or leak.
 * Does not itself check ADMIN_EMAILS: the callback route and every admin
 * action/page re-verify via requireAdmin()/requireAdminPage(), so sending
 * a link to a non-allowlisted address is harmless (they still can't get
 * past the allowlist check once signed in) and avoids leaking which
 * addresses are on the allowlist through a different error message here.
 */
export async function sendMagicLink(
  _prevState: SendMagicLinkState,
  formData: FormData,
): Promise<SendMagicLinkState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const supabase = await createAuthServerClient();
  const emailRedirectTo = await getMagicLinkCallbackUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      // The callback must return to this exact browser origin: localhost and
      // 127.0.0.1 have separate cookie jars, including the PKCE verifier.
      emailRedirectTo,
    },
  });

  if (error) {
    return { status: "error", message: "Could not send the link. Try again in a moment." };
  }

  return { status: "sent" };
}

export async function logoutAdmin(): Promise<void> {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
