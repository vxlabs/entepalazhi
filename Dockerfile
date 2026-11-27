# Production image for the Ente Palazhi site. Built and run by
# docker-compose.yml; see README.md "Hosting".
# The build does not need the database: pages are rendered on request.
# The database is a SQLite file on the volume mounted at /data/db.

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
# better-sqlite3 compiles its native module when no prebuilt binary fits
# this Node/Alpine combination. Build tools stay in this stage only.
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Baked into the client bundle, so it has to be known at build time.
ARG NEXT_PUBLIC_SITE_URL=https://entepalazhi.in
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads \
    DATABASE_PATH=/data/db/entepalazhi.db

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts
# The standalone output keeps better-sqlite3 and sharp only under
# node_modules/.pnpm, where the server finds them but plain
# `node scripts/*.mjs` cannot.
# Photo uploads depend on sharp's native binary, so the last line loads it:
# if it is missing from this image, the build fails instead of the live site.
RUN for pkg in better-sqlite3 sharp; do \
      [ -e "/app/node_modules/$pkg" ] \
      || ln -s "$(ls -d /app/node_modules/.pnpm/$pkg@*/node_modules/$pkg | head -n 1)" "/app/node_modules/$pkg"; \
      test -f "/app/node_modules/$pkg/package.json" || exit 1; \
    done \
 && node -e "require('sharp')"

# The database and photos live on volumes mounted here (see docker-compose.yml).
RUN mkdir -p /data/uploads /data/db && chown -R node:node /data
# Next writes its on-disk cache here at runtime. The images folder is a
# volume too; creating it here is what makes that volume owned by `node`.
RUN mkdir -p /app/.next/cache/images && chown -R node:node /app/.next/cache
USER node

EXPOSE 3000
# Apply any new database migrations, then start the site.
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
