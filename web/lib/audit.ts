import "server-only";
import { execute } from "@/lib/db";

/**
 * Every admin change writes one row here. If a published claim is ever
 * disputed there is a record of who wrote it and when.
 */
export async function writeAuditLog(entry: {
  actorEmail: string;
  action: string;
  projectId?: string;
  diff?: Record<string, unknown>;
}): Promise<void> {
  try {
    await execute(
      `insert into admin_audit_log (actor_email, action, project_id, diff)
       values (@actor_email, @action, @project_id, @diff)`,
      {
        actor_email: entry.actorEmail,
        action: entry.action,
        project_id: entry.projectId ?? null,
        diff: entry.diff ? JSON.stringify(entry.diff) : null,
      },
    );
  } catch (error) {
    // Never let an audit-log failure block the change it describes.
    console.error("Failed to write admin_audit_log:", error);
  }
}
