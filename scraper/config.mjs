// Central config: loads .env (gitignored; see .env.example for the full list)
// and exposes every tunable with a default, so operators can adjust behaviour
// without editing code. This is the single dotenv-loading module — import it
// (directly or transitively via lib/session.mjs) and .env is picked up.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(name, fallback) {
  return process.env[name] || fallback;
}

function bool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export const config = {
  // --- Runtime state ---
  // Directory for scratch (raw downloads), logs, and storageState.json.
  // Defaults to the project directory; in Docker point DATA_DIR at a mounted
  // volume so state survives container runs.
  dataDir: str('DATA_DIR', path.dirname(fileURLToPath(import.meta.url))),

  // --- Postgres (the app reads from the same DB) ---
  databaseUrl: str('DATABASE_URL', ''),

  // --- Schedule (used by scheduler.mjs) ---
  // How often to run the scrape, in hours. Configurable without rebuilds.
  scrapeIntervalHours: int('SCRAPE_INTERVAL_HOURS', 8),
  // Run once immediately on container start (true) or wait for the first
  // interval (false).
  runOnStart: bool('RUN_ON_START', true),

  // --- TimeEdit ---
  baseUrl: str('TIMEEDIT_BASE_URL', 'https://cloud.timeedit.net/my_um/web/students/'),

  // --- Course fetch (injected into the in-page steps/fetch/courses.js) ---
  courseConcurrency: int('COURSE_CONCURRENCY', 40), // requests in flight for event/detail probes
  coursePageConcurrency: int('COURSE_PAGE_CONCURRENCY', 12), // objects.html page fetches
  coursePageSize: int('COURSE_PAGE_SIZE', 100),
  courseMaxObjects: int('COURSE_MAX_OBJECTS', 30000),
  courseRetries: int('COURSE_RETRIES', 3),

  // --- run.mjs browser orchestration ---
  scriptRetries: int('SCRIPT_RETRIES', 3), // reload-and-retry per browser script
  // Timeout for navigating to the TimeEdit students page. The first load after
  // the short-lived token dies bounces through the silent SSO re-auth chain,
  // which can take well over Playwright's 30s default.
  navigationTimeoutMs: int('NAVIGATION_TIMEOUT_MS', 2 * 60 * 1000),
  lecturerTimeoutMs: int('LECTURER_TIMEOUT_MS', 5 * 60 * 1000),
  courseTimeoutMs: int('COURSE_TIMEOUT_MS', 50 * 60 * 1000),
  sessionBounceMs: int('SESSION_BOUNCE_MS', 15_000), // wait for SSO bounce before judging
  sessionReauthMs: int('SESSION_REAUTH_MS', 90_000), // grace for silent SSO re-auth
  logKeepDays: int('LOG_KEEP_DAYS', 14),
};
