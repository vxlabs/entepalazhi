import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/settings";
import { SettingsForm } from "./settings-form";
import { PasswordForm } from "./password-form";
import { AdminPage, PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const actor = await requireAdminPage();
  const settings = await getSiteSettings();

  return (
    <AdminPage className="max-w-2xl">
      <PageHeader title="Settings" />
      <SettingsForm settings={settings} />

      <section aria-labelledby="password-heading" className="mt-10 space-y-4 border-t pt-8">
        <div>
          <h2 id="password-heading" className="text-base font-semibold">Change password</h2>
          <p className="text-sm text-muted-foreground">For {actor.email}.</p>
        </div>
        <PasswordForm email={actor.email} />
      </section>
    </AdminPage>
  );
}
