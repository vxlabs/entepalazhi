import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminActor } from "@/lib/auth";
import { SITE_CONFIG } from "@/lib/site-config";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  // Not requireAdminPage(): that would redirect back to this same page.
  // If a valid session already exists, skip straight to the dashboard.
  const actor = await getAdminActor();
  if (actor) redirect("/admin");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-[var(--admin-shadow-raised)]">
        <BrandMark className="mx-auto mb-5 size-12 text-lg" />
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight">{SITE_CONFIG.adminName} admin</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Sign in with your admin account.</p>
        <LoginForm />
      </div>
    </div>
  );
}
