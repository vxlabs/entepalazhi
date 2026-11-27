import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getPendingSubmissions } from "@/lib/data/admin";
import { QueueCard } from "@/components/admin/queue-card";
import { AdminPage, PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Reviews" };

export default async function QueuePage() {
  await requireAdminPage();
  const submissions = await getPendingSubmissions();

  return (
    <AdminPage className="max-w-2xl">
      <PageHeader title="Reviews" description={`${submissions.length} waiting on you`} />
      {submissions.length === 0 && <p className="text-sm text-muted-foreground">Nothing needs review right now.</p>}
      <div className="space-y-4">
        {submissions.map((s) => (
          <QueueCard key={s.id} submission={s} />
        ))}
      </div>
    </AdminPage>
  );
}
