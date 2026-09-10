-- Aarekettikkan - Phase 2 schema additions (submissions, admin, support).
-- See the Phase 2 plan ("Schema additions - supabase/migrations/0002_admin.sql")
-- for the full rationale behind each table.
--
-- RLS posture, unchanged from 0001: anon/authenticated get no write policy
-- anywhere in this file, and no read policy either except site_settings
-- (whose content is meant to become public copy once support is enabled).
-- Every write in Phase 2 goes through a Next.js Server Action or Route
-- Handler using the service-role key, which bypasses RLS entirely.

-- ---------------------------------------------------------------------
-- project_submitters - contact details, admin-only
-- ---------------------------------------------------------------------

-- Deliberately a separate table, not columns on projects: RLS is
-- row-level, not column-level. If submitter contact info lived on
-- projects, the public-read policy on that table would expose it the
-- moment a lead is approved and published.
create table if not exists public.project_submitters (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects (id) on delete cascade,
  name                 text,
  email                text,
  phone                text,
  note                 text,
  ip_hash              text,
  -- Paths (relative to the pending-photos bucket) for photos uploaded with
  -- the submission, before they exist as project_media rows. project_media
  -- rows are only ever created once a photo is copied into project-photos
  -- (see lib/storage.ts - storage_path there is always project-photos-
  -- relative), so an unapproved submission's photos live here until
  -- actions/admin/approve.ts moves them across and creates those rows.
  pending_photo_paths  text[] not null default '{}',
  created_at           timestamptz not null default now()
);

create index if not exists project_submitters_project_idx on public.project_submitters (project_id);

alter table public.project_submitters enable row level security;
-- No policies: anon and authenticated have zero access. Only the
-- service-role key (admin queue, submission action) can read or write.

-- ---------------------------------------------------------------------
-- seen_confirmations - "I've seen this too"
-- ---------------------------------------------------------------------

create table if not exists public.seen_confirmations (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  fingerprint text not null,
  created_at  timestamptz not null default now(),
  unique (project_id, fingerprint)
);

create index if not exists seen_confirmations_project_idx on public.seen_confirmations (project_id);

alter table public.seen_confirmations enable row level security;
-- No anon/authenticated policies. /api/seen writes with the service-role
-- key; record_seen_confirmation() below is also security definer so the
-- write path stays correct even if it's ever called with a lesser key.

-- Idempotent record-and-increment in one round trip: the unique constraint
-- absorbs repeat clicks, and seen_count on projects only advances when a
-- new fingerprint is actually inserted.
create or replace function public.record_seen_confirmation(p_project_id uuid, p_fingerprint text)
returns table (seen_count int, already_seen boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  did_insert boolean;
begin
  insert into public.seen_confirmations (project_id, fingerprint)
  values (p_project_id, p_fingerprint)
  on conflict (project_id, fingerprint) do nothing;

  get diagnostics did_insert = row_count;
  did_insert := did_insert::int > 0;

  if did_insert then
    -- Qualified as p.seen_count on the right-hand side: the OUT parameter
    -- above is also named seen_count, and PL/pgSQL resolves the bare
    -- column name to that variable first, making an unqualified
    -- `seen_count + 1` here silently read the (always-null) OUT param
    -- instead of the row's current value.
    update public.projects p set seen_count = p.seen_count + 1 where p.id = p_project_id;
  end if;

  return query
    select p.seen_count, not did_insert from public.projects p where p.id = p_project_id;
end;
$$;

-- ---------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action      text not null,
  project_id  uuid references public.projects (id) on delete set null,
  diff        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_project_idx on public.admin_audit_log (project_id);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
-- No anon/authenticated policies: audit rows are written and read only by
-- the service-role client (lib/audit.ts, /admin project history).

-- ---------------------------------------------------------------------
-- submission_rate_limit - Postgres-tracked IP rate limit for /report
-- ---------------------------------------------------------------------

create table if not exists public.submission_rate_limit (
  ip_hash text not null,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (ip_hash, day)
);

alter table public.submission_rate_limit enable row level security;
-- No anon/authenticated policies: only the submit-project server action
-- (service-role key) touches this table, via the function below.

-- Upserts today's counter for a hashed IP and returns whether the caller
-- is still within p_max_per_day. Single round trip avoids a
-- check-then-increment race between concurrent submissions.
create or replace function public.check_and_increment_rate_limit(p_ip_hash text, p_max_per_day int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.submission_rate_limit (ip_hash, day, count)
  values (p_ip_hash, current_date, 1)
  on conflict (ip_hash, day)
  do update set count = public.submission_rate_limit.count + 1
  returning count into new_count;

  return new_count <= p_max_per_day;
end;
$$;

-- ---------------------------------------------------------------------
-- site_settings - single-row config
-- ---------------------------------------------------------------------

-- A database row, not an environment variable: flipping support_enabled
-- from /admin/settings goes live immediately, with no Vercel redeploy and
-- no dashboard access required.
create table if not exists public.site_settings (
  id                     boolean primary key default true check (id),

  support_enabled        boolean not null default false,
  support_title_en       text,
  support_title_ml       text,
  support_body_en        text,
  support_body_ml        text,
  support_email          text,
  support_phone          text,
  support_upi_id         text,
  support_link_url       text,
  support_link_label_en  text,
  support_link_label_ml  text,

  -- Public profile links live here rather than in environment variables so
  -- the account can be changed from /admin/settings without a redeploy.
  instagram_url          text,

  updated_at             timestamptz not null default now(),
  updated_by             text
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

alter table public.site_settings enable row level security;

-- Public read: every column here is copy meant to become visible on
-- /support once enabled, or is used to decide whether nav/footer/sitemap
-- show the link at all - there is nothing sensitive to gate.
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy: only /admin/settings (service-role key)
-- can change this row.

-- ---------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------

-- Two buckets rather than one with path prefixes, so an unmoderated photo
-- is never reachable by guessing a public URL - it isn't in a public
-- bucket at all until approval copies it across.
insert into storage.buckets (id, name, public)
values ('pending-photos', 'pending-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do nothing;

drop policy if exists "project-photos public read" on storage.objects;
create policy "project-photos public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'project-photos');

-- No storage.objects policies for pending-photos, and no insert/update/
-- delete policies for either bucket: uploads land via a signed upload URL
-- minted server-side with the service-role key (see actions for the
-- signed-URL flow), and approval/deletion likewise run through the
-- service-role client. anon and authenticated have zero direct access to
-- pending-photos, matching the spec's "unmoderated content is never
-- reachable by URL guess" requirement.
