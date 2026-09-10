/** Row shapes mirroring supabase/migrations/0001_core.sql. Kept hand-written
 * (rather than generated) since Phase 1 has a small, stable schema; revisit
 * with `supabase gen types` once Phase 2's tables land. */

export type ProjectStatus =
  | "lead"
  | "reported"
  | "acknowledged"
  | "work_resumed"
  | "completed"
  | "no_action";

export type ProjectSource = "creator" | "public";

export type Project = {
  id: string;
  slug: string;
  name_en: string;
  name_ml: string | null;
  description_en: string | null;
  description_ml: string | null;
  district: string;
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
  status: ProjectStatus;
  source: ProjectSource;
  submitted_on: string;
  reported_on: string | null;
  resolved_on: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  seen_count: number;
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

export type ProjectListFilters = {
  district?: string;
  status?: ProjectStatus;
  department?: string;
  q?: string;
  sort?: "newest" | "days_desc" | "cost_desc" | "seen_desc";
};

/** Phase 2 row shapes, mirroring supabase/migrations/0002_admin.sql. */

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

export type SeenConfirmation = {
  id: string;
  project_id: string;
  fingerprint: string;
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
