import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminActor } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

type LoginSearchParams = Promise<{ auth_error?: string | string[] }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  // Not requireAdminPage(): that would redirect back to this same page.
  // If a valid session already exists, skip straight to the dashboard.
  const actor = await getAdminActor();
  if (actor) redirect("/admin");

  const { auth_error: authError } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-[var(--admin-shadow-raised)]">
        <span className="admin-gradient mx-auto mb-5 grid size-12 place-items-center rounded-xl text-xl font-black text-white shadow-sm" aria-hidden="true">
          A
        </span>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight">Aarekettikkan admin</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Sign in with your allowlisted email.</p>
        <LoginForm authError={typeof authError === "string" ? authError : undefined} />
      </div>
    </div>
  );
}
