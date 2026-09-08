// Run on YOUR machine (headed). Log in through the UM SSO in the opened
// browser window; the session is then saved to storageState.json for upload
// to the server.
import path from 'node:path';
import { chromium } from 'playwright';
import { config } from '../config.mjs';
import { BASE_URL, bouncedToSso, waitForLoggedIn } from '../lib/session.mjs';

// Writes next to the code (project dir) on your machine; in Docker this is
// overridden by DATA_DIR, where storageState.json is mounted in.
const OUT = path.join(config.dataDir, 'storageState.json');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log(`Opening ${BASE_URL}. Log in through the UM SSO in the opened window.`);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutMs });

// Wait out the initial SSO redirect so the momentary pre-redirect students URL
// isn't mistaken for a completed login.
await bouncedToSso(page);

try {
  await waitForLoggedIn(page);
} catch (err) {
  console.error(`Login not detected: ${err.message}`);
  await browser.close();
  process.exit(1);
}

await context.storageState({ path: OUT });
console.log(`Session saved to ${OUT}`);
console.log('Upload this file to the server\'s DATA_DIR (storageState.json).');
await browser.close();
