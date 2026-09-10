# Aarekettikkan — Phase 2: Submissions, Admin & Support

> **Prerequisite: Phase 1 is complete.** See `there-is-a-social-floofy-star.md`.
> Phase 1 built everything that *reads*. This file builds everything that *writes*.
>
> Expected starting state: Next 16 App Router app on Vercel + Supabase, migration `0001_core.sql` applied, seed loaded, public site browsable in English and Malayalam, **no auth and no write paths of any kind**.

---

## Context recap

`mallu_boys88` documents incomplete and abandoned Kerala government projects on Instagram under the phrase **"Aarekettikkan"**. This site turns those videos into a searchable public record. Phase 1 delivered the public catalogue: district-filtered browsing, per-project detail pages with the video embedded, a live counter of days since he reported it, and a status timeline.

Phase 2 makes it *maintainable and participatory*: the public can report projects, he can moderate and publish them from his phone, and visitors can confirm what they've seen.

### Decisions carried forward

| Question | Decision |
|---|---|
| Public submissions | Admin approval queue — invisible to public until approved |
| Photos | Public upload allowed, held for moderation |
| Language | Bilingual, path-based `/` and `/ml/` (admin is English-only) |
| Supporting the cause | **No payment gateway.** Contact-only page, disabled by default |
| Roles | Single admin, email allowlist |

### Schema already in place (Phase 1)
`projects` (with `is_published`, `archived_at`, `source`, `submitted_on`, nullable `reported_on`, `seen_count`), `project_updates`, `project_media`. RLS: `anon` has **SELECT only** on published, non-archived rows.

---

## Schema additions — `supabase/migrations/0002_admin.sql`

### `project_submitters` — contact details, admin-only
`project_id fk, name, email, phone, ip_hash, created_at`

**Deliberately a separate table.** RLS is row-level, not column-level — if submitter email lived on `projects`, approving a project would expose it to every anonymous reader.

### `seen_confirmations` — "I've seen this too"
`project_id fk, fingerprint text, created_at, unique(project_id, fingerprint)`

Fingerprint = SHA-256 of `IP + user-agent + daily-rotating salt`. The unique constraint gives idempotency; a Postgres function increments the denormalised `projects.seen_count` in the same transaction. No PII stored, no login.

### `admin_audit_log`
`id, actor_email, action, project_id, diff jsonb, created_at`

Every admin mutation writes one row. If a published claim is ever disputed there is a record of who wrote it and when; if a volunteer moderator is added later, accountability already exists. Cheap now, impossible to backfill.

### `site_settings` — single-row config
```
id                boolean pk default true CHECK (id)   -- enforces exactly one row
support_enabled   boolean not null default false
support_title_en / support_title_ml     text
support_body_en  / support_body_ml      text           -- plain text, rendered as paragraphs
support_email     text
support_phone     text
support_upi_id    text                                  -- optional; see Support page
support_link_url  text
support_link_label_en / _ml             text
updated_at, updated_by
```

**A database row, not an environment variable.** Flipping an env var on Vercel triggers a redeploy and needs dashboard access; a settings row flips instantly from his phone.

### Storage buckets
- `pending-photos` — **private**, unmoderated uploads
- `project-photos` — **public read**, approved photos only

Approval copies the object across and deletes the pending original. Two buckets rather than path prefixes, so unmoderated content is never reachable by URL guess.

### RLS
Unchanged for `anon`: SELECT only, published rows only. No anon policy on any table added here. **Every write in this phase goes through a Next.js Server Action using the service-role key, server-side only**, after zod validation.

---

## Routes added

| Route | Rendering | Contents |
|---|---|---|
| `/report` | Static shell | Public submission form, bilingual, photo upload, spam controls |
| `/support` | Dynamic | Contact-only page. **404s while `support_enabled` is false**; hidden from nav, footer and sitemap |
| `/admin/login` | Dynamic | Supabase magic link, allowlisted emails only |
| `/admin` | Dynamic | Triage home |
| `/admin/queue` | Dynamic | Pending submissions |
| `/admin/projects` | Dynamic | All projects, filter, inline publish toggle |
| `/admin/projects/[id]` | Dynamic | Sectioned editor |
| `/admin/settings` | Dynamic | Support toggle + bilingual content |
| `/api/seen` | Route handler | "I've seen this too" endpoint |

`/report` and `/support` sit **inside** `app/[locale]/`. Admin sits **outside** it and is English-only.

---

## Public submission flow

Form → zod validation (schemas shared with the client via `lib/schemas.ts`) → server action with service-role key → row inserted as `source='public'`, `status='lead'`, `is_published=false`, `submitted_on=today`. Contact details go to `project_submitters`. Photos go to `pending-photos`.

**Spam controls, in order of cost:**
1. Honeypot field — free, catches most naive bots
2. IP rate limit — max N submissions per IP per day, tracked in Postgres
3. **Optional** Cloudflare Turnstile, env-gated: if `TURNSTILE_SECRET_KEY` is absent the app skips it entirely, so handover works with only two accounts

**Photo upload must bypass the server action.** Vercel caps server action request bodies at ~4.5MB and phone photos routinely exceed that. Uploads go **direct to Supabase Storage via a short-lived signed upload URL** minted server-side, with client-side compression (`browser-image-compression`) before upload to protect the 1GB free-tier budget. Getting this wrong produces uploads that fail only on real phones and never in testing.

---

## Admin dashboard

**The governing assumption: he is a creator, not an operator, and he will use this on a phone.** Realistically he approves a submission while travelling, or adds a timeline entry standing at the site he just filmed. A desktop-style data grid would be the wrong build. Every admin screen is mobile-first and widens on desktop.

### Auth
Supabase magic link (email OTP) — no password to lose or leak. Access gated by an `ADMIN_EMAILS` allowlist checked in middleware **and independently re-checked inside every admin server action**.

Middleware alone is not an authorisation boundary in Next.js — that assumption was exactly the CVE-2025-29927 bypass. The server action is the real gate; middleware is only a redirect convenience.

### `/admin` — triage home, not a redirect stub
Answers "what needs me today":
- Pending submissions awaiting review (count, tap straight through)
- **Going stale** — published, still `reported`, no timeline entry in 90+ days
- Leads not yet filmed, oldest first — his shooting backlog
- Recently resolved, for a morale hit and a share prompt

The going-stale list is the one to argue hardest for. Without it, projects get posted once and quietly rot, and the site's central claim — that it tracks what happened *after* the video — stops being true.

### `/admin/queue` — moderation
Card per submission with photo thumbnails, submitter note, district. Three actions: **approve into editor** (pre-filled; he enriches, sets `reported_on` and video URL if he's filmed it, then publishes), **reject with a reason**, or **archive**. Submitter contact sits in a collapsible panel — he will want to call them for directions before filming, which is the whole reason `project_submitters` exists.

### `/admin/projects/[id]` — the editor
Sectioned, not one endless form:

| Section | Contents |
|---|---|
| Details | Bilingual field pairs side by side; English required, Malayalam optional |
| Location | District select, local body, **map pin picker** |
| Money & tenure | Cost + note, tenure, department, inaugurated, promised completion |
| Media | Instagram/YouTube URLs **with live embed preview** |
| Photos | Upload, reorder, caption, remove |
| Timeline | Add/edit updates; `status_after` drives project status |
| Publish | Status, resolved date, publish toggle, "view live" link |

Four details that decide whether this is pleasant or miserable:

- **Live embed preview.** He pastes the Instagram URL and sees it render in the editor. Given how fragile Instagram embeds are, catching a dead or private link *before* publishing beats discovering it as a blank box on the live site.
- **Map pin by Google Maps paste.** Hitting an exact spot on a phone-sized Leaflet map is fiddly. He'll already have a Maps link from being on location — so accept a pasted URL and parse lat/lng out of it, with click-and-drag as fallback.
- **Photo upload via signed URL** — same ~4.5MB constraint as the public form.
- **Draft safety.** `is_published = false` *is* the draft state, so half-finished entries are always saveable. Add an unsaved-changes navigation guard — a long bilingual form lost to flaky mobile data is the fastest way to make him abandon the tool.

### Cross-cutting
- **No hard deletes.** Everything archives via `archived_at`. On a site whose purpose is preserving a record, an accidental irreversible delete is the worst failure, and unpublish covers every legitimate takedown.
- **One role only.** Email allowlist, no roles table, no permissions UI.
- Every mutation writes `admin_audit_log` and calls `revalidatePath` on the affected public routes, so corrections go live immediately despite Phase 1's static rendering.

---

## "I've seen this too"

`POST /api/seen` with the project id. Server computes the fingerprint, inserts into `seen_confirmations`, and lets the unique constraint absorb repeats; a Postgres function increments `projects.seen_count`. One click, no login, no PII. Client shows optimistic state and a settled count.

---

## Support page — contact only, off by default

**No payment gateway, no checkout, no transaction ever initiated by the site.** The page states what the work costs and gives a way to reach him. Nothing more.

This is the right call because he is an individual with nothing registered. RBI's Payment Aggregator Guidelines make full KYC mandatory for every Indian gateway, and donation onboarding effectively expects 80G/12A plus a registration certificate. A live donate button would also raise an FCRA question on every click: donations from Indian citizens abroad are not foreign contribution, but **OCI and PIO cardholders count as foreigners**, and one button cannot tell a Gulf NRI from an OCI holder in Toronto. Contact-only sidesteps all of it, and keeps Vercel's non-commercial Hobby tier clean.

**Behaviour**
- Gated entirely on `site_settings.support_enabled`, default `false`
- While disabled, `/support` calls `notFound()` and the link is absent from nav, footer and sitemap — not merely hidden with CSS
- Content bilingual and admin-editable; body stored as plain text and rendered as paragraphs, **never as HTML**, so the field can't become an injection vector
- `support_upi_id` is an optional **displayed string plus a locally generated QR** — a printed detail on a contact page, not a payment integration. Blank by default; drop the field entirely if no money reference is wanted at all

**Page copy is built around three real costs** — travel and fuel to reach sites across Kerala, RTI application fees, and a legal defence fund. Naming these concretely does more work than a donate button: it tells people what the work costs and why it's under pressure.

**One editorial constraint.** A site premised on public money being wasted must be visibly careful about money reaching it. If support is enabled, the page should state plainly that he is an individual, that contributions are not tax-deductible, and where the money goes. That candour is the project's credibility and costs nothing.

*README note, not a build constraint: money reaching him directly is still taxable personal income, and FCRA still applies to foreign-citizen donors however it arrives. Not collecting on-site avoids the site being the mechanism, not his personal tax position.*

---

## Build order

| Step | Deliverable |
|---|---|
| **2a** | `0002_admin.sql`, both storage buckets, service-role client with a server-only import guard |
| **2b** | `/report` form, signed-URL photo upload, honeypot + rate limit + optional Turnstile |
| **3a** | Magic-link auth, `ADMIN_EMAILS` allowlist in middleware **and** every server action |
| **3b** | `/admin` triage home, `/admin/queue` approve/reject with photo promotion |
| **3c** | Sectioned editor: fields, map-pin picker, live embed preview, photos, timeline, audit log |
| **4** | `/api/seen`, `/admin/settings`, gated `/support` page |
| **5** | Malayalam pass over new strings, responsive/a11y polish, deploy, handover docs |

---

## Files to create

```
app/
  [locale]/
    report/page.tsx
    support/page.tsx              404s unless support_enabled
  admin/
    login/page.tsx
    page.tsx                      triage home
    queue/page.tsx
    projects/page.tsx
    projects/[id]/page.tsx        sectioned editor
    settings/page.tsx
  api/seen/route.ts
middleware.ts                     admin redirect only — NOT the authz boundary
components/
  admin/ProjectEditor.tsx, TimelineEditor.tsx, PhotoUploader.tsx,
        MapPinPicker.tsx, EmbedPreview.tsx, QueueCard.tsx
  SeenButton.tsx
  SupportPanel.tsx
lib/
  supabase/admin.ts               service-role client — server-only import guard
  auth.ts                         requireAdmin() used by every admin action
  schemas.ts                      zod, shared by form + server action
  ratelimit.ts
  fingerprint.ts
  audit.ts
actions/
  submit-project.ts
  admin/approve.ts, reject.ts, update-project.ts, timeline.ts, settings.ts
supabase/migrations/0002_admin.sql
README.md                         full handover runbook
```

---

## Verification

**Submission → moderation**
1. Submit via `/report` → the row must **not** appear on `/projects`
2. Approve in `/admin/queue` → appears publicly, and the photo moves from `pending-photos` to `project-photos`
3. Upload a 6MB phone photo — must succeed via signed URL, proving the ~4.5MB server-action cap is bypassed
4. Submit repeatedly from one IP → rate limit trips
5. Publish a lead with no `reported_on` → counter reads "days since the public flagged this"; add `reported_on` → switches to "days since reported"

**Security — do not skip**
6. With the anon key alone, attempt `insert into projects` and `select * from project_submitters` — both rejected by RLS
7. A `pending-photos` object URL returns 403 when signed out
8. `/admin` signed out, and with a non-allowlisted email — both refused
9. **Call an admin server action directly with a non-allowlisted session, bypassing middleware entirely** — must still be rejected. This is the check that matters; the middleware redirect is not the boundary
10. Put `<script>` and raw HTML into the support body field — must render as literal text, not execute

**Admin usability — test on a real phone, not a resized window**
11. Approve a submission end-to-end one-handed: queue → editor → publish
12. Paste a Google Maps link into location → lat/lng parsed correctly
13. Paste a dead/private Instagram URL into the editor → preview shows the fallback, not a blank frame
14. Edit a project → a row lands in `admin_audit_log` with the actor's email, and the public page reflects the edit immediately (`revalidatePath` fired)

**Support page**
15. With `support_enabled = false`, `/support` 404s, appears in no nav or footer, and is absent from `sitemap.xml`. Toggle on in `/admin/settings` → live **without a redeploy**

**Deployed**
16. Lighthouse on a detail page — no YouTube/Instagram JS before interaction
17. Hit "I've seen this too" twice from the same browser — count increments once

---

## Handover

`README.md` runbook: create Supabase project → run both migrations in the SQL editor → create the two buckets → copy `.env.example` into Vercel env vars → import repo → add his email to `ADMIN_EMAILS`.

Ownership transfer is three steps: transfer the GitHub repo, the Vercel project, and the Supabase organisation.

**Two free-tier caveats for the README:**
- Supabase pauses free projects after **7 days of zero activity**. Real traffic prevents this; a twice-daily Vercel cron ping guarantees it.
- Vercel Hobby is non-commercial. Fine here since the site never collects money — but ads or sponsorship later would require a paid plan.
