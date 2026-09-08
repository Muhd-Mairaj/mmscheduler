// Run on the SERVER (every SCRAPE_INTERVAL_HOURS via scheduler.mjs): the
// entrypoint that scrapes TimeEdit and loads the result straight into
// Postgres.
//
//   1. load the SSO session and run the in-page fetchers in steps/fetch/
//      (lecturer.js, courses.js) to download the raw TimeEdit data,
//   2. parse it with steps/load.mjs (single pass, no intermediate files)
//      and swap it into Postgres in one transaction.
//
// The app reads from the same DB, so there is no git commit/push and no
// Netlify rebuild in this loop.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { config } from './config.mjs';
import { BASE_URL, bouncedToSso, isLoggedIn, waitForLoggedIn } from './lib/session.mjs';
import { openDb } from './lib/db.mjs';
import { loadFromRaw } from './steps/load.mjs';
import { notify } from './lib/notify.mjs';
import { probeSession, reauthenticate } from './lib/reauth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(config.dataDir, '.raw'); // raw downloads (plain dir)
const LOGS_DIR = path.join(config.dataDir, 'logs');
const STORAGE_STATE = path.join(config.dataDir, 'storageState.json');
const COURSE_RAW = 'course_events_with_details.json';
const LECTURER_RAW = 'lecturer_data.json';

// Params handed to the in-page steps/fetch/courses.js (it cannot read .env).
const coursePageConfig = {
  baseUrl: config.baseUrl,
  pageSize: config.coursePageSize,
  maxObjects: config.courseMaxObjects,
  concurrency: config.courseConcurrency,
  pageConcurrency: config.coursePageConcurrency,
  retries: config.courseRetries,
};
const SCRIPTS = [
  { script: 'steps/fetch/lecturer.js', filename: LECTURER_RAW, timeoutMs: config.lecturerTimeoutMs, pageConfig: null },
  // steps/fetch/courses.js enumerates ~29k course objects concurrently but only
  // pulls details + reservation HTML for the ~2.5k that have events. A full
  // run is ~25 min, hence the long timeout.
  { script: 'steps/fetch/courses.js', filename: COURSE_RAW, timeoutMs: config.courseTimeoutMs, pageConfig: coursePageConfig },
];
const RETRIES = config.scriptRetries;
const DRY_RUN = process.argv.includes('--dry-run');

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(line);
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOGS_DIR, `${new Date().toISOString().slice(0, 10)}.log`), line + '\n');
  rotateLogs();
}

function rotateLogs(keep = config.logKeepDays) {
  const files = fs.readdirSync(LOGS_DIR).sort();
  for (const f of files.slice(0, Math.max(0, files.length - keep))) {
    fs.rmSync(path.join(LOGS_DIR, f));
  }
}

async function runScript(page, { script, filename, timeoutMs, pageConfig }) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const downloadPromise = page.waitForEvent('download', { timeout: timeoutMs });
      if (pageConfig) {
        await page.evaluate((cfg) => { window.__MMS_CONFIG__ = cfg; }, pageConfig);
      }
      await page.addScriptTag({ path: path.join(__dirname, script) });
      const download = await downloadPromise;
      await download.saveAs(path.join(RAW_DIR, filename));
      log(`downloaded ${filename}`);
      return;
    } catch (err) {
      log(`attempt ${attempt}/${RETRIES} failed for ${filename}: ${err.message}`);
      if (attempt === RETRIES) throw err;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
}

async function main() {
  if (!config.databaseUrl) throw new Error('DATABASE_URL not set (see .env)');
  if (!fs.existsSync(STORAGE_STATE)) {
    throw new Error('storageState.json missing. Run bun run auth on your machine and copy it to DATA_DIR.');
  }

  // One-time migration: .raw used to be a git clone of the raw-data branch.
  if (fs.existsSync(path.join(RAW_DIR, '.git'))) {
    fs.rmSync(RAW_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(RAW_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    // TE Auth (TimeEdit's login script) does not boot for a default headless
    // client, so the run uses a normal Chrome UA with the automation flag off.
    // Harmless for the data fetch; required for the silent re-auth below.
    args: ['--disable-blink-features=AutomationControlled'],
  });
  try {
    const context = await browser.newContext({
      storageState: STORAGE_STATE,
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    // Establish a live TimeEdit session up front. The TimeEdit session cookie is
    // short-lived; once stale (e.g. the previous run was hours ago) the data
    // APIs answer 412 with no silent recovery unless we drive the login. Probe
    // one object endpoint; if it 412s, run the headless re-auth, which uses the
    // persistent Entra cookie for a silent sign-in (see lib/reauth.mjs).
    {
      const sessionPage = await context.newPage();
      sessionPage.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() === 'error') log(`[page] ${text}`);
      });
      await sessionPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutMs });
      const bounced = await bouncedToSso(sessionPage, config.sessionBounceMs);
      if (bounced || !(await isLoggedIn(sessionPage))) {
        try {
          await waitForLoggedIn(sessionPage, config.sessionReauthMs);
        } catch {
          throw new Error('Session expired: TimeEdit redirected to SSO. Re-run bun run auth on your machine and update storageState.json.');
        }
      }
      if (!(await probeSession(sessionPage))) {
        log('TimeEdit session stale; attempting silent re-auth');
        if (!(await reauthenticate(context))) {
          throw new Error(
            'Session expired: silent re-auth failed. Re-run bun run auth on your machine and update storageState.json.',
          );
        }
        log('re-auth OK; TimeEdit session refreshed');
      }
      await sessionPage.close();
      await context.storageState({ path: STORAGE_STATE });
    }

    for (const entry of SCRIPTS) {
      const page = await context.newPage();
      // Surface the in-page fetch's progress + failures (per-phase timing,
      // per-task errors) so concurrency tuning and outages are visible in the
      // log. lecturer.js batch chatter is filtered out.
      page.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() === 'error' || text.startsWith('course fetch:') || text.startsWith('task ')) {
          log(`[page] ${text}`);
        }
      });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutMs });
      // Wait out the initial SSO redirect so a momentary pre-redirect URL isn't
      // mistaken for a valid session. With a valid session there is no bounce,
      // so this waits a short grace period and proceeds.
      const bounced = await bouncedToSso(page, config.sessionBounceMs);
      if (bounced || !(await isLoggedIn(page))) {
        // The page left the students page. When the short-lived TimeEdit token
        // dies, this is usually a silent single-sign-on re-auth (the persistent
        // ESTSAUTHPERSISTENT cookie) rather than a real expiry — give it a
        // grace period to come back to the students page before declaring the
        // session dead, exactly as a normal browser would.
        try {
          await waitForLoggedIn(page, config.sessionReauthMs);
        } catch {
          throw new Error('Session expired: TimeEdit redirected to SSO. Re-run bun run auth on your machine and update storageState.json.');
        }
      }
      await runScript(page, entry);
      await page.close();
    }
    // Persist any refreshed session (e.g. after a silent SSO re-auth) so the
    // next run starts with a fresh token instead of re-bouncing.
    await context.storageState({ path: STORAGE_STATE });
    await browser.close();
  } catch (err) {
    await browser.close().catch(() => {});
    log(`FAILED: ${err.message}`);
    await notify(`Timetable fetch FAILED: ${err.message}`, { level: 'error' });
    process.exit(1);
  }

  log('raw data downloaded; loading into Postgres');
  if (DRY_RUN) {
    log('dry-run: skipping DB load');
    process.exit(0);
  }

  const { db, close } = openDb(config.databaseUrl);
  try {
    const counts = await loadFromRaw(db, path.join(RAW_DIR, COURSE_RAW), path.join(RAW_DIR, LECTURER_RAW));
    log(`DB refreshed: ${counts.courses} courses, ${counts.occurrences} occurrences, ${counts.activities} activities`);
    await notify(
      `Timetable refresh done: ${counts.courses} courses, ${counts.occurrences} occurrences, ${counts.activities} activities`,
    );
  } catch (err) {
    log(`DB LOAD FAILED: ${err.message}`);
    await notify(`Timetable DB load FAILED: ${err.message}`, { level: 'error' });
    process.exitCode = 1;
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
