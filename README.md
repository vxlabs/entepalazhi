# Aarekettikkan

A public accountability record for stalled/abandoned government projects in Kerala. See `there-is-a-social-floofy-star.md` (Phase 1) and `there-is-a-social-floofy-star-phase-2.md` (Phase 2) for the full plan.

**Status: Phase 1 + Phase 2 complete.** Public bilingual site, public submissions (`/report`), full admin dashboard (triage, moderation queue, sectioned project editor, settings), "I've seen this too", and a gated support/contact page.

## Stack

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript, Tailwind CSS v4 + shadcn/ui, Supabase (Postgres + RLS + Auth + Storage), react-leaflet/OpenStreetMap, date-fns-tz (Asia/Kolkata), zod v4.

**Note on this Next.js version:** `middleware.ts` is deprecated and renamed to `proxy.ts` (exporting a `proxy` function) — see `proxy.ts`'s own comment. If you're used to older Next.js docs/training data, check `node_modules/next/dist/docs/` before assuming a convention still applies; see `AGENTS.md`.

## Local development

Requires Docker (for the local Supabase stack) and the Supabase CLI (`npx supabase`, no global install needed).

```bash
pnpm install
npx supabase start      # first run pulls images and applies supabase/migrations + seed.sql
```

`supabase start` prints an `ANON_KEY`, `SERVICE_ROLE_KEY`, and `API_URL` (normally `http://127.0.0.1:54321`). Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from `supabase start`'s output
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- `SUPABASE_SERVICE_ROLE_KEY` — from `supabase start`'s output (`SERVICE_ROLE_KEY`)
- `ADMIN_EMAILS` — your own email, comma-separated if more than one

```bash
pnpm dev
```

Visit `http://localhost:3000` (redirects to `/en`). Supabase Studio is at `http://127.0.0.1:54323`; the local email catcher (for magic-link sign-in) is at `http://127.0.0.1:54324`.

Admin magic links use PKCE, so open a fresh link in the same browser profile and origin that requested it. `localhost` and `127.0.0.1` have separate cookie jars; the sign-in callback automatically uses whichever local origin you opened. Multiple pending links are supported; a used or expired link must be replaced with a new one.

To stop the local stack: `npx supabase stop`.

### `431 Request Header Fields Too Large` in local development

Local Supabase sessions use cookies. If Firefox reports a `431` for a
`/_next/static/...` file, open DevTools → Storage → Cookies →
`http://localhost:3000` and delete the legacy cookies beginning with
`sb-127-auth-token`, then sign in to `/admin` again. If the error remains,
clear all localhost site data; that also signs out other local applications.

## Handover runbook (real Supabase + Vercel project)

1. Create a project at [supabase.com](https://supabase.com).
2. In its SQL editor, run the migrations in numerical order (`0001_core.sql`, `0002_admin.sql`, then `0003_site_social_links.sql`). Run `supabase/seed.sql` too if you want sample data, or skip it once real projects exist.
3. In Storage, confirm the two buckets from `0002_admin.sql` exist: `pending-photos` (private) and `project-photos` (public). The migration creates them via SQL, but double-check in the dashboard after running it.
4. In Project Settings > API, copy the Project URL, `anon` `public` key, and `service_role` key.
5. Import the repo into Vercel. Add every variable from `.env.example` to the Vercel project's environment variables, using the real values from steps 3–4, plus `ADMIN_EMAILS` set to the real admin's email(s) and `NEXT_PUBLIC_SITE_URL` set to the real deployed domain.
6. In Supabase Auth settings, set the Site URL to the deployed domain and add a wildcard redirect URL covering `https://your-domain/admin/auth/callback**`. This permits Supabase's PKCE `sb_flow_id` query parameter on magic-link callbacks.
7. Deploy. Sign in at `/admin/login` with an allowlisted email to confirm the magic link arrives and admin loads. Open the link in the same browser profile that requested it.

### Ownership transfer

Three steps, done independently: transfer the **GitHub repo**, the **Vercel project**, and the **Supabase organisation** to the new owner's accounts.

### Free-tier caveats

- **Supabase pauses free projects after 7 days of zero activity.** Real traffic prevents this; a twice-daily Vercel Cron Job hitting any page (e.g. `/en`) guarantees it without relying on visitors.
- **Vercel Hobby is non-commercial.** Fine here — the site never collects money (see "Support page" below) — but ads or sponsorship later would require a paid plan.

## Structure

- `app/[locale]/` — the public bilingual site (`/en/...`, `/ml/...`), including `/report` (public submissions) and `/support` (gated contact page). This *is* the app's root layout.
- `app/admin/` — a second, English-only root layout: `/admin` (triage home), `/admin/queue` (moderation), `/admin/projects` + `/admin/projects/[id]` (list + sectioned editor), `/admin/settings`, `/admin/login`.
- `app/(bare-redirects)/` — redirects unprefixed paths to `/en/...`.
- `app/global-not-found.tsx` — 404 for URLs matching no route at all.
- `app/api/seen/route.ts` — the "I've seen this too" endpoint.
- `proxy.ts` — admin-route redirect convenience only, **not** the authorization boundary (see its comment and `lib/auth.ts`).
- `lib/data/projects.ts` — public read-only data access (anon key, RLS-gated).
- `lib/data/admin.ts`, `lib/data/settings.ts` — admin-side reads (service-role key).
- `lib/supabase/server.ts` (anon, cookie-free), `lib/supabase/admin.ts` (service-role, server-only), `lib/supabase/auth-server.ts` (cookie-aware, admin session), `lib/supabase/browser.ts` (anon, browser — signed-upload PUTs only).
- `lib/auth.ts` — `requireAdmin()`/`requireAdminPage()`, the actual authorization check re-verified in every admin server action and page.
- `lib/schemas.ts` — zod schemas shared by every form and its server action.
- `actions/` — all Server Actions, split into public (`submit-project.ts`, `uploads.ts`, `maps.ts`) and `actions/admin/*` (approve/reject, project edits, timeline, media, settings, auth).
- `lib/i18n/dict.ts` — all UI copy, English and Malayalam, in one file.
- `supabase/migrations/0001_core.sql`, `0002_admin.sql` — schema + RLS + storage buckets. `supabase/seed.sql` — sample data for local dev.

## Checks

```bash
npx tsc --noEmit
npx eslint .
pnpm build
```

All three are clean as of Phase 2 completion. `npx supabase migration up` applies pending migrations to the local stack without resetting existing data; `npx supabase db reset` re-applies everything from scratch (destructive to local data).
