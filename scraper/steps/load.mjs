// Single load step: raw TimeEdit downloads -> Postgres (via lib/timetable.mjs
// parsing + lib/store.mjs transactional replace). Replaces the old
// clean.mjs -> transform.py -> git commit/push chain.
//
// Usable as a library (run.mjs) or standalone:
//   node steps/load.mjs <course_raw.json> <lecturer_raw.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.mjs';
import { openDb } from '../lib/db.mjs';
import { replaceAll } from '../lib/store.mjs';
import { parseRawToRows } from '../lib/timetable.mjs';

export async function loadFromRaw(db, courseRawPath, lecturerRawPath) {
  const courseRaw = JSON.parse(fs.readFileSync(courseRawPath, 'utf8'));
  const lecturerRaw = JSON.parse(fs.readFileSync(lecturerRawPath, 'utf8'));
  const rows = parseRawToRows(courseRaw, lecturerRaw);
  await replaceAll(db, rows);
  return {
    courses: rows.courses.length,
    occurrences: rows.occurrences.length,
    activities: rows.activities.length,
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [courseRawPath, lecturerRawPath] = process.argv.slice(2);
  if (!courseRawPath || !lecturerRawPath) {
    console.error('Usage: node steps/load.mjs <course_raw.json> <lecturer_raw.json>');
    process.exit(1);
  }
  const { db, close } = openDb(config.databaseUrl);
  try {
    const counts = await loadFromRaw(db, courseRawPath, lecturerRawPath);
    console.log(`loaded into Postgres: ${JSON.stringify(counts)}`);
  } finally {
    await close();
  }
}
