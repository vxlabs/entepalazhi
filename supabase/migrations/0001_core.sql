-- Aarekettikkan - Phase 1 core schema (public content only).
-- Phase 2 adds 0002_admin.sql (project_submitters, seen_confirmations,
-- admin_audit_log, site_settings) - do not add those tables here.
--
-- RLS posture (see the Phase 1 plan, "RLS posture"): the anon role gets
-- SELECT only, and only on published, non-archived projects and their
-- child rows. There is no insert/update/delete policy for anon anywhere in
-- this file - every write arrives in Phase 2 via a server action using the
-- service-role key, which bypasses RLS entirely. A public form that wrote
-- straight to Postgres from the browser would be the single most likely
-- way this site gets defaced, so that posture is established here, before
-- any write path exists.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------

create table if not exists public.projects (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,

  name_en                  text not null,
  name_ml                  text,
  description_en           text,
  description_ml           text,

  district                 text not null check (district in (
    'thiruvananthapuram', 'kollam', 'pathanamthitta', 'alappuzha',
    'kottayam', 'idukki', 'ernakulam', 'thrissur', 'palakkad',
    'malappuram', 'kozhikode', 'wayanad', 'kannur', 'kasaragod'
  )),
  local_body               text,
  local_body_type          text check (local_body_type in ('panchayat', 'municipality', 'corporation', 'other')),
  latitude                 double precision,
  longitude                double precision,

  cost_inr                 numeric check (cost_inr is null or cost_inr >= 0),
  cost_note                text check (cost_note in ('sanctioned', 'revised_estimate')),
  tenure                   text,
  inaugurated_on           date,
  promised_completion_on   date,
  department               text,

  status                   text not null default 'lead' check (status in (
    'lead', 'reported', 'acknowledged', 'work_resumed', 'completed', 'no_action'
  )),
  source                   text not null check (source in ('creator', 'public')),

  -- submitted_on is always set; reported_on is null until his video exists.
  -- The day counter resolves coalesce(reported_on, submitted_on) - see
  -- lib/dates.ts computeDayCounter(). A public submission is a *lead*, not
  -- a report: forcing reported_on to NOT NULL would mean inventing a fake
  -- date just to publish a tip.
  submitted_on             date not null default current_date,
  reported_on              date,
  resolved_on              date,

  instagram_url            text,
  youtube_url              text,

  seen_count                int not null default 0 check (seen_count >= 0),

  is_published              boolean not null default false,
  archived_at                timestamptz,
  updated_by                 uuid,

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint resolved_after_reported_or_submitted check (
    resolved_on is null or resolved_on >= coalesce(reported_on, submitted_on)
  )
);

comment on column public.projects.reported_on is
  'Date of the creator''s video. Null until filmed - see the coalesce(reported_on, submitted_on) day-counter logic.';

create index if not exists projects_published_idx on public.projects (is_published, archived_at);
create index if not exists projects_district_idx on public.projects (district);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_submitted_on_idx on public.projects (submitted_on desc);

-- ---------------------------------------------------------------------
-- project_updates - the status timeline
-- ---------------------------------------------------------------------

create table if not exists public.project_updates (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  happened_on   date not null,
  title_en      text not null,
  title_ml      text,
  body_en       text,
  body_ml       text,
  status_after  text check (status_after in (
    'lead', 'reported', 'acknowledged', 'work_resumed', 'completed', 'no_action'
  )),
  source_url    text,
  created_at    timestamptz not null default now()
);

create index if not exists project_updates_project_idx on public.project_updates (project_id, happened_on desc);

-- ---------------------------------------------------------------------
-- project_media - photos (upload path arrives in Phase 2; read-only here)
-- ---------------------------------------------------------------------

create table if not exists public.project_media (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  storage_path   text not null,
  caption_en     text,
  caption_ml     text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists project_media_project_idx on public.project_media (project_id, sort_order);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_media enable row level security;

drop policy if exists projects_public_read on public.projects;
create policy projects_public_read
  on public.projects
  for select
  to anon, authenticated
  using (is_published = true and archived_at is null);

drop policy if exists project_updates_public_read on public.project_updates;
create policy project_updates_public_read
  on public.project_updates
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
        and p.is_published = true
        and p.archived_at is null
    )
  );

drop policy if exists project_media_public_read on public.project_media;
create policy project_media_public_read
  on public.project_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and p.is_published = true
        and p.archived_at is null
    )
  );

-- No insert/update/delete policies for anon or authenticated on any of the
-- three tables above: the default-deny is intentional. Phase 2's admin
-- writes use the service-role key from server actions, which bypasses RLS.
