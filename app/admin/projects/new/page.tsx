import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { NewProjectEditor } from "@/components/admin/project-editor";

export const metadata: Metadata = { title: "Add an issue" };

export default async function NewAdminProjectPage() {
  await requireAdminPage();
  return <NewProjectEditor />;
}
