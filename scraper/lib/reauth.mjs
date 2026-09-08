// Silent TimeEdit session refresh.
//
// The TimeEdit session cookie (TEmy_umweb / te_auth_token) is short-lived —
// when it goes stale, the data APIs answer HTTP 412 instead of JSON and there
// is no headless path that refreshes it automatically. A real browser refreshes
// it by driving TimeEdit's "Log in" -> SSO broker -> Entra SAML flow, where the
// persistent ESTSAUTHPERSISTENT cookie makes the sign-in silent. This module
// reproduces that flow headlessly so the daily run can re-auth itself without a
// human, for as long as the persistent cookie is valid (~3 months).
//
// The flow was reverse-engineered from a captured interactive login; the
// selectors ("Log in", "Accept", "Sign in with SSO") are TimeEdit UI strings and
// may need updating if TimeEdit changes its login screens.

import { BASE_URL } from './session.mjs';

// Cookie domains to KEEP when forcing the logged-out state: the persistent
// Microsoft SSO cookies that make silent sign-in possible.
const MS_DOMAINS = /microsoftonline|login\.live|\.live\.com/;

// One object endpoint; answering 200 means the TimeEdit session is alive.
const OJSON = `${BASE_URL}objects/8600/o.json?fr=t&types=15&sid=5&l=en_US`;

function log(...args) {
  console.log(`[reauth] ${args.join(' ')}`);
}

// True when the page's TimeEdit session serves the object API (200), false when
// it is stale (412 or any error).
export async function probeSession(page) {
  try {
    const { status } = await page.evaluate(async (url) => {
      const r = await fetch(url);
      return { status: r.status };
    }, OJSON);
    return status === 200;
  } catch {
    return false;
  }
}

// Drive the login flow in `context` and return true once the TimeEdit session is
// verified working. The context must be seeded with a storageState that holds
// the persistent Microsoft cookies (steps/auth.mjs output).
export async function reauthenticate(context) {
  const page = await context.newPage();
  try {
    // 1. Force the logged-out TimeEdit state: drop its cookies and localStorage,
    //    keep only the Microsoft SSO cookies.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => localStorage.clear());
    for (const c of await context.cookies()) {
      if (!MS_DOMAINS.test(c.domain)) {
        await context.clearCookies({ name: c.name, domain: c.domain, path: c.path });
      }
    }

    // 2. Load the students page (logged out) and click its "Log in" control.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    const clickedLogin = await page.evaluate(() => {
      const el = [...document.querySelectorAll('input, button, a')].find((x) =>
        /log ?in/i.test(x.value || x.innerText || ''),
      );
      if (el) { el.click(); return true; }
      return false;
    });
    if (!clickedLogin) {
      log('no "Log in" control on the students page');
      return false;
    }
    log('clicked Log in');

    // 3. Wait for TimeEdit's SSO broker (www.timeedit.net).
    try {
      await page.waitForURL((u) => u.hostname === 'www.timeedit.net', { timeout: 45000 });
    } catch {
      log('never reached the SSO broker');
      return false;
    }
    log('at SSO broker');

    // 4. Accept the broker's cookie-consent banner, then click "Sign in with SSO".
    await page.waitForTimeout(4000);
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('button, input, a')].find((x) =>
        /accept|agree/i.test(x.innerText || x.value || ''),
      );
      if (a) a.click();
    });
    await page.waitForTimeout(1500);
    const clickedSso = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, input, a')].find((x) =>
        /sign ?in with sso/i.test(x.innerText || x.value || ''),
      );
      if (el) { el.click(); return true; }
      return false;
    });
    if (!clickedSso) {
      log('no "Sign in with SSO" button on the broker');
      return false;
    }
    log('clicked "Sign in with SSO"');

    // 5. The persistent cookie should make Entra sign in silently and return us
    //    to the cloud app with fresh TimeEdit cookies.
    try {
      await page.waitForURL((u) => u.hostname === 'cloud.timeedit.net', { timeout: 90000 });
    } catch {
      log('did not return from the SSO round-trip');
      return false;
    }

    // 6. Verify the new session actually serves the API.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const ok = await probeSession(page);
    log(ok ? 'session verified' : 'session NOT verified after re-auth');
    return ok;
  } finally {
    await page.close().catch(() => {});
  }
}
