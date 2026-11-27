-- Optional ward tag and contractor details on an issue.
--
-- ward_no: the ward number in the Olavanna Grama Panchayat list kept in
-- lib/directory.ts (WARDS). Validated in lib/schemas.ts rather than by a
-- CHECK, like projects.area, so the ward list can change without a
-- migration. The ward member shown on the issue page is looked up from that
-- list at render time, so it is always the current member.
--
-- contractor_name / contractor_source: as on a public-works site board.
-- A contractor is only ever recorded with its source (work order, RTI
-- reply, site board photo); lib/schemas.ts refuses a name without one.
alter table projects add column ward_no integer null;
alter table projects add column contractor_name text null;
alter table projects add column contractor_source text null;
