# mmscheduler_scraper — the UM timetable refresh pipeline (DB edition).
#
# A long-running image: the container runs `node scheduler.mjs`, which runs
# `node run.mjs` every SCRAPE_INTERVAL_HOURS (default 8) and loads the result
# straight into Postgres. The web app reads from the same DB, so there is no
# git push and no rebuild in this loop. Config comes from the environment
# (.env); scratch, logs and storageState.json live on a volume mounted at
# DATA_DIR so state survives container restarts.
#
# Bun manages deps (frozen lockfile); Node runs everything (the Playwright
# base image already ships it).

FROM mcr.microsoft.com/playwright:v1.62.1-noble

# Bun binary for installs (glibc build matches this image).
COPY --from=oven/bun:1.3.3-slim /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Install scraper deps. Playwright is pinned to 1.62.1, the same version the
# base image ships its chromium for, so no browser download is needed.
COPY scraper/package.json scraper/bun.lock ./scraper/
# Shared drizzle schema used by the scraper's DB layer (plain relative
# imports; resolved from scraper/node_modules, no db install needed).
COPY db ./db
RUN cd scraper && bun install --frozen-lockfile

COPY scraper ./scraper

# /app/db/*.js import bare packages (drizzle-orm, ...) resolved by walking up
# to /app/node_modules, which doesn't exist in this image — the only install
# is /app/scraper/node_modules. Expose it at the shared parent.
RUN ln -s /app/scraper/node_modules /app/node_modules

WORKDIR /app/scraper

# Scratch, logs, and storageState.json live on the mounted DATA_DIR volume.
ENV DATA_DIR=/data

ENTRYPOINT ["node", "scheduler.mjs"]
