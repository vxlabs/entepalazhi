"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { changePassword, requireAdmin, signIn, signOut } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, hashIp } from "@/lib/client-ip";
import { canAttemptLogin, recordFailedLogin } from "@/lib/ratelimit";

/** `email` is echoed back so the field keeps its value after a failed attempt. */
export type LoginState = { status: "idle" | "error"; message?: string; email?: string };

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

/**
 * Email + password sign-in. The same message is returned for an unknown
 * email and a wrong password, so the form cannot be used to find out which
 * addresses have accounts. Failed attempts are counted per IP address per
 * day (lib/ratelimit.ts) to blunt password guessing.
 */
export async function loginAdmin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.slice(0, 320) : "";
  const ipHash = hashIp(getClientIp(await headers()));
  if (!(await canAttemptLogin(ipHash))) {
    return { status: "error", email, message: "Too many failed attempts from this connection today. Try again tomorrow." };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const ok = parsed.success && (await signIn(parsed.data.email, parsed.data.password));
  if (!ok) {
    await recordFailedLogin(ipHash);
    return { status: "error", email, message: "Email or password is incorrect." };
  }

  redirect("/admin");
}

export type ChangePasswordState = { status: "idle" | "success" | "error"; message?: string };

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password.").max(200),
    new_password: z
      .string()
      .min(10, "New password must be at least 10 characters.")
      .max(200, "New password must be at most 200 characters."),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, { message: "The new passwords do not match." })
  .refine((d) => d.new_password !== d.current_password, {
    message: "The new password must be different from the current one.",
  });

/**
 * Changes the signed-in admin's password. A wrong current password counts
 * against the same per-IP daily limit as a failed sign-in, so a hijacked
 * session cannot be used to guess the password without bound.
 */
export async function changeAdminPassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const actor = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ipHash = hashIp(getClientIp(await headers()));
  if (!(await canAttemptLogin(ipHash))) {
    return { status: "error", message: "Too many failed attempts from this connection today. Try again tomorrow." };
  }

  const { current_password, new_password } = parsed.data;
  if (!(await changePassword(actor.email, current_password, new_password))) {
    await recordFailedLogin(ipHash);
    return { status: "error", message: "Current password is incorrect." };
  }

  await writeAuditLog({ actorEmail: actor.email, action: "change_password" });
  return { status: "success" };
}

export async function logoutAdmin(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}
