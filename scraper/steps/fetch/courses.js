// Optimized in-page course fetcher for the mmscheduler data pipeline.
//
// Replaces the original SDK main.js crawl. The old script fetched details and
// events for every one of ~29,000 course objects serially, even though the
// cleaner only keeps the ~2,300 that have scheduled events. This script:
//   1. enumerates course object IDs from the objects pages,
//   2. probes each object's events (ri.json) with a concurrency pool to find
//      which ones actually have reservations,
//   3. fetches o.json details and per-reservation ri.html detail pages ONLY for
//      those active courses, again with bounded concurrency,
//   4. downloads course_events_with_details.json with the same schema the
//      cleaner expects.
//
// It must run inside the TimeEdit page (the API rejects requests that did not
// come from a page that executed its JavaScript). run.mjs injects it exactly
// like it did main.js and captures the download.

(async () => {
  // Config is injected by run.mjs (the page cannot read .env); fall back to
  // the same defaults when run standalone.
  const CFG = (typeof window !== 'undefined' && window.__MMS_CONFIG__) || {};
  const BASE_URL = CFG.baseUrl || 'https://cloud.timeedit.net/my_um/web/students/';
  const PAGE_SIZE = CFG.pageSize || 100;
  const MAX_OBJECTS = CFG.maxObjects || 30000;
  const CONCURRENCY = CFG.concurrency ?? 40; // requests in flight per phase
  const PAGE_CONCURRENCY = CFG.pageConcurrency ?? 12; // objects.html page fetches
  const HTTP_RETRIES = CFG.retries ?? 3;
  const T0 = Date.now();
  const elapsed = () => `${((Date.now() - T0) / 1000).toFixed(0)}s`;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function getText(url) {
    for (let attempt = 1; attempt <= HTTP_RETRIES; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        if (attempt === HTTP_RETRIES) throw err;
        await sleep(400 * attempt + Math.random() * 300);
      }
    }
  }

  // Run `fn` over `items` with a bounded pool of workers.
  async function mapPool(items, fn, concurrency) {
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const i = next++;
        try {
          out[i] = await fn(items[i], i);
        } catch (err) {
          console.error(`task ${i} failed:`, err.message);
          out[i] = null;
        }
      }
    };
    const n = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: n }, worker));
    return out;
  }

  function parseDetailsHtml(html) {
    if (!html) return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const details = {};
    const detailTable = doc.querySelector('.detailedResObjects');
    if (detailTable) {
      for (const row of detailTable.querySelectorAll('tr')) {
        const columnNameCell = row.querySelector('.columnname');
        const valueCell = row.querySelector('.pr');
        if (columnNameCell && valueCell) {
          details[columnNameCell.textContent.trim()] = valueCell.textContent.trim();
        }
      }
    }
    return details;
  }

  console.log(`course fetch: enumerating objects... (${elapsed()})`);

  // ---- Phase 1: enumerate course object metadata from the objects pages ----
  // The page response has no reliable total-count element, so fetch a fixed
  // page range (MAX_OBJECTS / PAGE_SIZE) concurrently and keep whatever comes
  // back; pages past the real end return empty and are dropped. This is what
  // the old main.js effectively did (page until empty), just concurrent.
  const listUrl = (start) =>
    `${BASE_URL}objects.html?max=${PAGE_SIZE}&fr=t&partajax=t&im=f&sid=4&l=en_US&objects=&types=15&part=t&media=html&start=${start}`;

  const parsePage = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('[data-idonly]')).map((el) => ({
      id: el.dataset.id,
      idOnly: el.dataset.idonly,
      type: el.dataset.type,
      name: el.dataset.name,
    }));
  };

  const pageCount = Math.ceil(MAX_OBJECTS / PAGE_SIZE);
  const pageResults = await mapPool(Array.from({ length: pageCount }, (_, i) => i), async (i) => {
    const objs = parsePage(await getText(listUrl(i * PAGE_SIZE)));
    return objs.length > 0 ? objs : null;
  }, PAGE_CONCURRENCY);

  const allMeta = pageResults.filter(Boolean).flat();
  console.log(`course fetch: enumerated ${allMeta.length} objects (${elapsed()})`);

  // ---- Phase 2: probe each object's events to find the active courses ----
  const riUrl = (id) =>
    `${BASE_URL}ri.json?h=f&sid=3&p=0.m,12.n&objects=${id}&ox=0&types=0&fe=0&h2=f&l=en_EN`;

  const probes = await mapPool(allMeta, async (meta) => {
    const data = JSON.parse(await getText(riUrl(meta.idOnly)));
    if (!data || !data.reservations || !data.columnheaders || data.reservations.length === 0) return null;
    return { meta, ri: data };
  }, CONCURRENCY);

  const active = probes.filter(Boolean);
  console.log(`course fetch: ${active.length} objects have events (${elapsed()})`);

  // ---- Phase 3a: fetch o.json details for the active courses ----
  await mapPool(active, async (item) => {
    const text = await getText(`${BASE_URL}objects/${item.meta.idOnly}/o.json?fr=t&types=15&sid=5&l=en_US`);
    item.details = JSON.parse(text);
  }, CONCURRENCY);

  // ---- Phase 3b: fetch + parse the per-reservation detail HTML ----
  const resList = [];
  for (const item of active) {
    item.reservations = item.ri.reservations.map((rese) => ({
      ...rese,
      additional_info: item.ri.columnheaders.reduce((m, key, idx) => {
        m[key] = rese.columns[idx];
        return m;
      }, {}),
    }));
    for (const reservation of item.reservations) resList.push({ item, reservation });
  }

  await mapPool(resList, async ({ reservation }) => {
    const html = await getText(
      `${BASE_URL}ri.html?h=f&sid=3&types=4&fe=0&h2=f&l=en_EN&id=${reservation.id}&fr=t&step=0&ef=2&nocache=2`,
    );
    reservation.html_details = parseDetailsHtml(html);
  }, CONCURRENCY);

  // ---- Assemble the output in the cleaner's expected schema ----
  const result = active.map(({ meta, details, reservations }) => ({
    id: meta.id,
    idOnly: meta.idOnly,
    type: meta.type,
    name: meta.name,
    details,
    events: reservations,
  }));

  console.log(`course fetch: assembling ${result.length} objects, ${resList.length} reservations (${elapsed()})`);

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'course_events_with_details.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('course fetch: download triggered');
})().catch((err) => {
  console.error('course fetch FAILED:', err);
});
