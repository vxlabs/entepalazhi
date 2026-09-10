import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/settings";
import { SettingsForm } from "./settings-form";
import { AdminPage, PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await getSiteSettings();

  return (
    <AdminPage className="max-w-2xl">
      <PageHeader title="Settings" />
      <SettingsForm settings={settings} />
    </AdminPage>
  );
}
