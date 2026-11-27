# Ente Palazhi (web)

The public site for **entepalazhi.in**: a dated public record of civic issues in Palazhi, Kozhikode (Olavanna Grama Panchayat). What the platform is and its editorial rules are in [`../CLAUDE.md`](../CLAUDE.md); read that first.

Next.js 16 (App Router) + SQLite. No outside services are required: the database (one SQLite file), admin login and photo storage all run inside one container on your own server.

This codebase started as a copy of the `aarekettikkan` pilot. It is independent of it: separate git history from the clone point, separate database, no shared configuration.

## What is here today

- Public, bilingual (`/ml` default, `/en`): home, issue list with area / status / department filters and search, a page per area, issue pages with a day counter, photos, map and dated updates, a report form, an about page, and an optional support page.
- Admin (`/admin`, English): email + password sign-in, review queue for public reports, issue editor, updates, photos, site settings, audit log.

Not built yet: the noticeboard and the directory (rentals, businesses).

## Run it locally

Needs Node 22 and pnpm. There is no database server: SQLite is a file, created at `DATABASE_PATH` (`./data/entepalazhi.db`).

```bash
pnpm install
cp .env.example .env.local                           # defaults work as they are
node scripts/migrate.mjs --seed                      # tables + clearly labelled sample issues
node scripts/create-admin.mjs you@example.com        # asks for a password
pnpm dev                                             # http://localhost:3000
```

To start again from scratch, stop `pnpm dev` and delete the `data/` folder.

Checks before committing: `npx tsc --noEmit`, `pnpm lint`, `pnpm build`.

## Where things are

| What | Where |
|---|---|
| Site name, domain, Instagram account | `lib/site-config.ts` |
| All public wording, English and Malayalam | `lib/i18n/dict.ts` |
| The list of areas within Palazhi, map centre | `lib/areas.ts` |
| Colours (the notice-board yellow is `board-*`) | `app/globals.css` |
| Database schema | `db/migrations/*.sql` (applied by `scripts/migrate.mjs`) |
| Every database query | `lib/data/` (reads), `actions/` (writes), via `lib/db.ts` |
| Photo storage on disk | `lib/uploads.ts`, served by `app/media/` |
| Admin sign-in and sessions | `lib/auth.ts`, `actions/admin/auth.ts` |

Things to know before changing code:

- **The database does not hide unpublished rows for you.** Public pages must read only through `lib/data/projects.ts`, where every query carries `is_published = 1 and archived_at is null`. Anything that reads drafts or contact details belongs in `lib/data/admin.ts`, behind `requireAdmin()`.
- **Internal names say `projects`, the site says "issues".** The table, types and admin URLs kept the pilot's name; public URLs are `/issues`.
- **Schema changes are new files.** Add `db/migrations/0002_something.sql`; never edit a migration that has already run. Each file runs in one transaction. SQLite conventions: ids are UUID text, timestamps are ISO-8601 UTC text (use `NOW` from `lib/db.ts` for "now"), dates are `YYYY-MM-DD` text, and booleans are `boolean` columns holding 0/1.
- **Areas are a list in code**, not a database constraint. Edit `lib/areas.ts`; keep a slug unchanged once issues are filed under it.
- **Photos are re-encoded on upload.** `lib/uploads.ts` converts every photo to WebP (at most 2048 px on the long side) and drops its metadata, GPS position included, before writing it. Pages then show them through `next/image`, which serves a copy resized for the visitor's screen.
- This Next.js version differs from older ones (`proxy.ts` instead of `middleware.ts`, two root layouts). See `AGENTS.md`.

## Hosting (Linux server, Docker)

```bash
cp .env.example .env       # optional: IP_HASH_SALT, and NEXT_PUBLIC_SITE_URL if not https://entepalazhi.in
docker compose up -d --build
docker compose exec web node scripts/create-admin.mjs you@example.com
```

- The site listens on `127.0.0.1:3000` only. Point your reverse proxy (nginx, Caddy, Coolify) at it with HTTPS, and pass the original `Host` and `X-Forwarded-For` / `X-Forwarded-Proto` headers: form submissions and the per-IP limits depend on them. Allow request bodies of at least 6 MB for photo uploads.
- Database migrations run automatically each time the `web` container starts.
- On the shared server, where Coolify's Traefik already owns ports 80/443, add the overlay: `docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build`. It routes entepalazhi.in through Traefik and gets a Let's Encrypt certificate.
- To update: `git pull && docker compose up -d --build`.

### Backups

Two Docker volumes hold everything that cannot be rebuilt:

- `entepalazhi_db`: the database (`entepalazhi.db`).
- `entepalazhi_uploads`: photos.

Back up both on a schedule. Don't copy `entepalazhi.db` directly while the site is running, because recent writes can still be in the `-wal` file. Take a consistent copy with:

```bash
docker compose exec web node scripts/backup.mjs
```

The copy is written to `backups/` inside the `db` volume; copy it off the server.

A third volume, `entepalazhi_image-cache`, holds the resized copies of photos that the site makes on demand. It needs no backup: it refills by itself, and is capped at 500 MB (`images.maximumDiskCacheSize` in `next.config.ts`).

### Photos stored before the WebP conversion

Photos uploaded before uploads were converted to WebP are still JPEG or PNG on disk. To convert them once (back up the database and the uploads volume first; the originals are deleted):

```bash
docker compose exec web node scripts/convert-photos-to-webp.mjs --dry-run   # list what would change
docker compose exec web node scripts/convert-photos-to-webp.mjs
```

### Admin accounts

There is no sign-up page and no password reset email. To add an admin or reset a password, run `scripts/create-admin.mjs` again with the email; it also signs that account out everywhere.
