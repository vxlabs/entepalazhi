-- Existing deployments may already have applied 0002_admin.sql. Keep this
-- additive migration so their single settings row gains the editable link.
alter table public.site_settings
  add column if not exists instagram_url text;
