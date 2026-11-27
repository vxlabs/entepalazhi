/** Row shapes mirroring db/migrations/0001_init.sql, as lib/db.ts returns
 * them: `date` columns as "YYYY-MM-DD", timestamps as ISO strings, ids
 * lowercase. Hand-written; keep in step with the migrations. */

export type ProjectStatus =
  | "lead"
  | "reported"
  | "acknowledged"
  | "work_resumed"
  | "completed"
  | "no_action";

export type ProjectSource = "admin" | "public";

export type Project = {
  id: string;
  slug: string;
  name_en: string;
  name_ml: string | null;
  description_en: string | null;
  description_ml: string | null;
  area: string;
  local_body: string | null;
  local_body_type: "panchayat" | "municipality" | "corporation" | "other" | null;
  latitude: number | null;
  longitude: number | null;
  cost_inr: number | null;
  cost_note: "sanctioned" | "revised_estimate" | null;
  tenure: string | null;
  inaugurated_on: string | null;
  promised_completion_on: string | null;
  department: string | null;
  ward_no: number | null;
  contractor_name: string | null;
  contractor_source: string | null;
  status: ProjectStatus;
  source: ProjectSource;
  submitted_on: string;
  reported_on: string | null;
  resolved_on: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  is_published: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectUpdate = {
  id: string;
  project_id: string;
  happened_on: string;
  title_en: string;
  title_ml: string | null;
  body_en: string | null;
  body_ml: string | null;
  status_after: ProjectStatus | null;
  source_url: string | null;
  created_at: string;
};

export type ProjectMedia = {
  id: string;
  project_id: string;
  storage_path: string;
  caption_en: string | null;
  caption_ml: string | null;
  sort_order: number;
  created_at: string;
};

/** An issue as the list pages load it: the row itself, plus its first
 * photo and most recent update, so a card can show them without a query
 * per card. Named in `_en`/`_ml` pairs so pick() reads them. */
export type ProjectListItem = Project & {
  cover_path: string | null;
  cover_caption_en: string | null;
  cover_caption_ml: string | null;
  latest_update_on: string | null;
  latest_update_title_en: string | null;
  latest_update_title_ml: string | null;
};

export type ProjectListFilters = {
  area?: string;
  status?: ProjectStatus;
  department?: string;
  q?: string;
  sort?: "newest" | "days_desc" | "cost_desc";
};

/** Admin-side rows. */

export type ProjectSubmitter = {
  id: string;
  project_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  note: string | null;
  ip_hash: string | null;
  created_at: string;
};

export type AdminAuditLog = {
  id: string;
  actor_email: string;
  action: string;
  project_id: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
};

export type SiteSettings = {
  id: true;
  support_enabled: boolean;
  support_title_en: string | null;
  support_title_ml: string | null;
  support_body_en: string | null;
  support_body_ml: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_upi_id: string | null;
  support_link_url: string | null;
  support_link_label_en: string | null;
  support_link_label_ml: string | null;
  instagram_url: string | null;
  updated_at: string;
  updated_by: string | null;
};
