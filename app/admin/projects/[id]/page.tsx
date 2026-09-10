import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { getProjectForEditor } from "@/lib/data/admin";
import { ProjectEditor } from "@/components/admin/project-editor";

export const metadata: Metadata = { title: "Edit case" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function AdminProjectEditPage({ params, searchParams }: Props) {
  await requireAdminPage();
  const { id } = await params;
  const data = await getProjectForEditor(id);
  if (!data) notFound();

  const { created } = await searchParams;
  return <ProjectEditor data={data} created={created === "1"} />;
}
