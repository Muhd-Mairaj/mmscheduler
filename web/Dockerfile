# mmscheduler web (Next.js). Reads timetable data from Postgres via the
# vendored @mmscheduler/db copy (see web/scripts/vendor-db.mjs). Build
# context is the repo root. Bun manages deps (frozen lockfile), Node runs the
# build: `bun run` executes package bins via their node shebangs.
# Migrations run on container start, before `next start`.
FROM node:22-slim

# Bun binary for installs (glibc build matches this image).
COPY --from=oven/bun:1.3.3-slim /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Root manifests are installed so /app/node_modules exists for db/migrate.mjs
# at runtime, and so the outermost bun.lock marks /app as the project root.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY web/package.json web/bun.lock ./web/
# web/scripts + db/ must exist before install: postinstall vendors db/
# sources into web/node_modules (no db install needed anywhere).
COPY web/scripts ./web/scripts
COPY drizzle ./drizzle
COPY db ./db
RUN cd web && bun install --frozen-lockfile

COPY web ./web

WORKDIR /app/web

RUN bun run build

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run start"]
