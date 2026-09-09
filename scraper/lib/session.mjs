// Session helpers shared by steps/auth.mjs and run.mjs.
import { config } from '../config.mjs';

export const BASE_URL = config.baseUrl;

// True when the page is on the TimeEdit student page and no SSO password field
// is visible (i.e. we did not get bounced to a login screen).
export async function isLoggedIn(page) {
  if (!page.url().startsWith(BASE_URL)) return false;
  const passwordVisible = await page
    .locator('input[type="password"]')
    .first()
    .isVisible()
    .catch(() => false);
  return !passwordVisible;
}

// After navigating to the students page, wait out the initial UM SSO redirect.
// The page briefly sits on the students URL before the client-side SAML bounce
// to Microsoft lands — without this wait, that momentary URL is mistaken for a
// completed login and an empty session gets saved. Returns true when the page
// redirected away (login required), false when it stayed (already logged in).
export async function bouncedToSso(page, timeoutMs = 30_000) {
  try {
    await page.waitForURL((url) => !url.toString().startsWith(BASE_URL), { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

// Polls isLoggedIn every 2s until true; throws after timeoutMs.
export async function waitForLoggedIn(page, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timed out waiting for login on ${page.url()}`);
}
