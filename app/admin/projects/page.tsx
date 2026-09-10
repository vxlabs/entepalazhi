import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getAllProjectsAdmin, type AdminProjectFilters } from "@/lib/data/admin";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n/dict";
import { getDistrict } from "@/lib/kerala";
import { buttonVariants } from "@/components/ui/button";
import { CaseFilters } from "@/components/admin/case-filters";
import { AdminPage, PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Cases" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminProjectsPage({ searchParams }: Props) {
  await requireAdminPage();
  const params = await searchParams;
  const dict = getDictionary("en");
  const filters: AdminProjectFilters = {
    status: params.status,
    district: params.district,
    query: params.q?.trim(),
    published: params.published === "true" ? true : params.published === "false" ? false : undefined,
    reported: params.reported === "true" ? true : params.reported === "false" ? false : undefined,
  };
  const projects = await getAllProjectsAdmin(filters);

  return (
    <AdminPage className="max-w-4xl">
      <PageHeader
        title="Cases"
        description={`${projects.length} found`}
        action={<Link href="/admin/projects/new" className={buttonVariants()}>Add a case</Link>}
      />
      <CaseFilters query={params.q} status={params.status} district={params.district} published={params.published} reported={params.reported} />
      <div className="divide-y rounded-xl border bg-card">
        {projects.map((project) => (
          <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{project.name_en}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {getDistrict(project.district)?.en ?? project.district} · {project.is_published ? "Published" : "Draft"}
              </p>
            </div>
            <StatusBadge status={project.status} dict={dict} />
            <span className="text-sm text-primary">Edit</span>
          </Link>
        ))}
        {projects.length === 0 && <p className="p-5 text-sm text-muted-foreground">No cases match these filters.</p>}
      </div>
    </AdminPage>
  );
}
