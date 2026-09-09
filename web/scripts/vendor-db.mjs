// Vendors the shared @mmscheduler/db sources into
// web/node_modules/@mmscheduler/db as REAL files. Runs as web's postinstall,
// so it happens on every `bun install` (local, Docker, Netlify).
//
// Why a copy instead of a `file:../db` dependency? Bun vendors `file:` deps
// as per-file symlinks, and Turbopack refuses to parse a symlinked
// package.json ("a redirect can't be parsed as json"), which breaks
// `next build`. Real files sidestep this entirely.
//
// Consequence: after editing db/, re-run `bun install --cwd web` (or at
// least this script) so the copy is refreshed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', '..', 'db');
const dest = path.join(here, '..', 'node_modules', '@mmscheduler', 'db');
// Only the runtime sources — never node_modules or lockfiles.
const FILES = ['package.json', 'index.js', 'queries.js', 'schema.js', 'migrate.mjs'];

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log(`vendored @mmscheduler/db (${FILES.length} files, postinstall)`);
