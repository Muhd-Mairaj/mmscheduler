// Long-running scheduler: runs `node run.mjs` every SCRAPE_INTERVAL_HOURS
// (default 8, configurable in .env) and sleeps in between. Each cycle runs as
// a child process so browser/memory state never leaks between runs, and runs
// never overlap — the next wait starts after the previous run finishes.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const intervalMs = config.scrapeIntervalHours * 60 * 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runOnce() {
  return new Promise((resolve) => {
    console.log(`[scheduler] starting scrape run (next in ~${config.scrapeIntervalHours}h)`);
    const child = spawn('node', [path.join(__dirname, 'run.mjs'), ...process.argv.slice(2)], {
      stdio: 'inherit',
    });
    child.on('exit', (code, signal) => {
      console.log(`[scheduler] run finished (code=${code}${signal ? ` signal=${signal}` : ''})`);
      resolve();
    });
    child.on('error', (err) => {
      console.error(`[scheduler] failed to spawn run: ${err.message}`);
      resolve();
    });
  });
}

let stopping = false;
process.on('SIGTERM', () => {
  console.log('[scheduler] SIGTERM received, finishing current wait then exiting');
  stopping = true;
});
process.on('SIGINT', () => {
  console.log('[scheduler] SIGINT received, exiting');
  process.exit(0);
});

console.log(`[scheduler] interval: every ${config.scrapeIntervalHours}h (SCRAPE_INTERVAL_HOURS)`);
if (config.runOnStart) {
  await runOnce();
} else {
  console.log('[scheduler] RUN_ON_START=false, waiting for first interval');
}
while (!stopping) {
  await sleep(intervalMs);
  if (stopping) break;
  await runOnce();
}
console.log('[scheduler] stopped');
