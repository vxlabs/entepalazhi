import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every admin mutation writes one row here. If a published claim is ever
 * disputed there is a record of who wrote it and when; if a volunteer
 * moderator is added later, accountability already exists. See
 * supabase/migrations/0002_admin.sql for the table.
 */
export async function writeAuditLog(entry: {
  actorEmail: string;
  action: string;
  projectId?: string;
  diff?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    actor_email: entry.actorEmail,
    action: entry.action,
    project_id: entry.projectId ?? null,
    diff: entry.diff ?? null,
  });
  // Never let an audit-log write failure block the mutation it's
  // describing - log and move on rather than throwing mid-action.
  if (error) console.error("Failed to write admin_audit_log:", error);
}
