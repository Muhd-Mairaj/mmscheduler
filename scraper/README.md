# mmscheduler scraper

Downloads the UM timetable from TimeEdit and loads it straight into Postgres,
which the web app reads. One pipeline, no intermediate files, no git pushes:

1. `scheduler.mjs` runs `run.mjs` every `SCRAPE_INTERVAL_HOURS` (default 8).
2. `run.mjs` drives the in-page fetchers in `steps/fetch/` (lecturer.js,
   courses.js) to download the raw TimeEdit data into `DATA_DIR/.raw`.
3. `steps/load.mjs` parses the raw data (`lib/timetable.mjs`, single pass)
   and swaps it into Postgres in one transaction (`lib/store.mjs`).

If the fetch fails you get a notification (see `NOTIFY_WEBHOOK_URL`); the DB
keeps serving the previous snapshot until a run succeeds.

## Configure

All config is env vars — see `.env.example` for the full list. The knobs
you'll touch first:

```
DATABASE_URL=postgres://mmscheduler:changeme@db:5432/mmscheduler
SCRAPE_INTERVAL_HOURS=8
DATA_DIR=/data   # (in Docker; locally it defaults to this folder)
```

The only secret file is `storageState.json` (your UM login session): on your
machine run `bun run auth`, log in with UM SSO in the opened browser, then
copy the resulting `storageState.json` next to `.env` (locally) or into
`./scraper-data/` (docker compose bind-mount). It lasts ~3 months; when runs
start failing with "Session expired", repeat this step.

## Run locally

```bash
cd scraper
bun install
cp .env.example .env   # set DATABASE_URL
bun run schedule        # runs now, then every SCRAPE_INTERVAL_HOURS
# or once:  bun run run
# or dry-run the fetch without touching the DB: bun run run -- --dry-run
```

## Seed without scraping

A full scrape takes ~25 min. To populate an empty DB instantly from the
legacy JSON snapshot:

```bash
DATABASE_URL=... bun run seed [path/to/json]
```

## Run everything with docker compose

From the repo root — see `docker-compose.yml` and `.env.example` there:

```bash
cp .env.example .env
# put storageState.json in ./scraper-data/
docker compose up --build -d
```

Services: `db` (Postgres 16), `web` (Next.js on :3000, migrates on start),
`scraper` (`scheduler.mjs`, every `SCRAPE_INTERVAL_HOURS`).

## Credits

The in-page fetchers (`steps/fetch/`) and the cleaning rules
(`lib/timetable.mjs`) are based on
[um-timetable-sdk](https://github.com/damnitjoshua/um-timetable-sdk) by
[damnitjoshua](https://github.com/damnitjoshua).
