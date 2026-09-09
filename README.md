# MMScheduler

MMScheduler is an unofficial timetable planner for University of Malaya students. It helps you compare module occurrences, avoid clashes, and put together a class and exam schedule.

**[Try MMScheduler](https://mmscheduler.netlify.app/)**

> MMScheduler is a personal project and is not affiliated with Universiti Malaya. Timetable information may be incomplete or change, so always check your final schedule against official UM systems.

The latest data refresh targets **Semester 1, 2026/2027** (`2026/S1`). Some records may keep older period labels from the source data. The project has been used by UM students over the past four semesters.

## Features

- Search for modules by code or name
- Compare class times, rooms, and lecturers across occurrences
- Automatically disable clashing occurrences
- Generate a schedule with **AI Scheduling** based on lecturer and day-off preferences
- View separate class and exam timetables
- Track selected credits and download timetables as PNGs
- Keep your plan in local browser storage
- Light and dark themes

### About AI Scheduling

AI Scheduling is a local heuristic, not an LLM. It tries every possible combination, removes clashes, scores the remaining schedules using your preferences, and picks the best result. It runs in a Web Worker in your browser and does not send your schedule to an external AI service.

It may take longer when you add many modules with many occurrences.

## Run locally

You need [Bun](https://bun.sh/) 1.3 or newer (package manager) with Node.js
20.9 or newer installed (scripts execute via node), plus Postgres 16+. The
repo has three parts: `web/` (Next.js app), `scraper/` (TimeEdit refresh
pipeline), `db/` (shared Drizzle schema, vendored into `web/` on install).

```bash
git clone https://github.com/Muhd-Mairaj/mmscheduler.git
cd mmscheduler
bun run install:all   # installs root + web/ + scraper/ deps
cp .env.example .env  # set POSTGRES_PASSWORD / DATABASE_URL
```

Easiest is docker compose, which runs Postgres, the web app, and the
scraper (every `SCRAPE_INTERVAL_HOURS`, default 8) together:

```bash
# put storageState.json (from `cd scraper && bun run auth`) in ./scraper-data/
docker compose up --build -d
```

Or run just the database and the app manually:

```bash
docker compose up -d db
bun run db:migrate
bun run db:seed   # one-time seed from the legacy JSON snapshot (no 25-min scrape)
cd web && DATABASE_URL=postgres://mmscheduler:<password>@localhost:5432/mmscheduler bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The API routes read from
Postgres via `DATABASE_URL` (`web/.env` is also picked up by `next dev`).

For a production build:

```bash
cd web
bun run build
bun run start
```

## Timetable data

The timetable lives in Postgres (`courses` → `occurrences` → `activities`,
see `db/schema.js`, queried with Drizzle). The scraper in `scraper/`
refreshes it from TimeEdit every `SCRAPE_INTERVAL_HOURS` (default 8, set in
`.env`) — see `scraper/README.md`. The legacy snapshot
`web/app/all_courses_updated_one_week_schedule_occ_separated.json` is only used
to seed an empty DB (`bun run db:seed`); nothing reads it at runtime. Note:
`bun install` in `web/` copies `db/` sources into `web/node_modules` (see
`web/scripts/vendor-db.mjs`), so re-run it after editing `db/`.

## Built with

Next.js 16, React 19, CSS Modules, Bootstrap/Reactstrap, Font Awesome, and `html2canvas`, with Postgres + Drizzle as the data layer. The app is deployed on Netlify (set `DATABASE_URL` there) and reads the timetable from Postgres rather than querying TimeEdit directly.

## Authors

Made by [Mairaj](https://github.com/Muhd-Mairaj/) and [Mohammed Alsharafi](https://github.com/Mohammed-AlSharafi/). The name **MMScheduler** is a play on our names.

Licensed under the [MIT License](LICENSE).
