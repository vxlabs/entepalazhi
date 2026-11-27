import "server-only";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NOW, execute, queryOne, transaction } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_DAYS, ADMIN_SESSION_PATH } from "@/lib/session-cookie";

export type AdminActor = { email: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Looks the session cookie up in admin_sessions on every request - the
 * cookie is a random token, not something that can be decoded or forged
 * locally. cache()-wrapped so repeated calls within one render share a
 * single lookup. Returns null rather than throwing; callers decide whether
 * to redirect (pages) or reject (actions and route handlers).
 */
export const getAdminActor = cache(async (): Promise<AdminActor | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<{ email: string }>(
    `select u.email
       from admin_sessions s
       join admin_users u on u.id = s.user_id
      where s.token_hash = @token_hash and s.expires_at > ${NOW}`,
    { token_hash: hashToken(token) },
  );
  return row ? { email: row.email } : null;
});

/** Admin pages and layouts: redirect to login if there is no valid session. */
export async function requireAdminPage(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login");
  return actor;
}

/**
 * Every admin server action and route handler: the actual authorization
 * boundary. proxy.ts only redirects browsers that have no cookie at all, as
 * a convenience - a Server Function is a POST to whatever route defines
 * it, reachable directly regardless of proxy matchers. This is the check
 * that cannot be bypassed by skipping the UI. Throws (rather than
 * redirecting) since actions and route handlers return responses.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) throw new Error("Unauthorized: admin session required.");
  return actor;
}

/** Checks the credentials and, if they match, starts a session. */
export async function signIn(email: string, password: string): Promise<boolean> {
  const user = await queryOne<{ id: string; password_hash: string }>(
    "select id, password_hash from admin_users where email = @email",
    { email: email.trim().toLowerCase() },
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) return false;

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await execute(`delete from admin_sessions where expires_at <= ${NOW}`);
  await execute(
    "insert into admin_sessions (token_hash, user_id, expires_at) values (@token_hash, @user_id, @expires_at)",
    { token_hash: hashToken(token), user_id: user.id, expires_at: expires },
  );

  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_SESSION_PATH,
    expires,
  });
  return true;
}

/**
 * Replaces the signed-in admin's password after checking the current one.
 * Every other session for the account is ended (a stolen cookie should not
 * outlive a password change); the session making the change stays signed in.
 */
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await queryOne<{ id: string; password_hash: string }>(
    "select id, password_hash from admin_users where email = @email",
    { email },
  );
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) return false;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const passwordHash = await hashPassword(newPassword);
  await transaction(async () => {
    await execute("update admin_users set password_hash = @password_hash where id = @user_id", {
      password_hash: passwordHash,
      user_id: user.id,
    });
    await execute("delete from admin_sessions where user_id = @user_id and token_hash <> @keep_token_hash", {
      user_id: user.id,
      keep_token_hash: hashToken(token),
    });
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await execute("delete from admin_sessions where token_hash = @token_hash", { token_hash: hashToken(token) });
  }
  store.set(ADMIN_SESSION_COOKIE, "", { path: ADMIN_SESSION_PATH, maxAge: 0 });
}
