// One-time seed: load the legacy app JSON file
// (web/app/all_courses_updated_one_week_schedule_occ_separated.json) into
// Postgres. Use this to populate the DB without waiting for a full ~25 min
// scrape, e.g. on first setup:
//
//   DATABASE_URL=... node scraper/steps/seed-from-json.mjs [path/to/json]
//
// After the first real scrape run, the DB is the source of truth and the
// JSON file is no longer read by anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.mjs';
import { openDb } from '../lib/db.mjs';
import { replaceAll } from '../lib/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_JSON = path.join(__dirname, '..', '..', 'web', 'app', 'all_courses_updated_one_week_schedule_occ_separated.json');

export function appJsonToRows(appJson) {
  const courses = [];
  const occurrences = [];
  const activities = [];

  for (const courseId of Object.keys(appJson).sort()) {
    const occList = appJson[courseId];
    // Courses with no occurrences still get a row (with null details) so
    // lookups return [] exactly like the old JSON file did.
    const first = occList && occList.length > 0 ? occList[0] : {};
    courses.push({
      courseId,
      module: first.module ?? null,
      credits: first.credits ?? null,
      yearPeriod: first.yearPeriod ?? null,
      overallTargetStudent: first.overallTargetStudent ?? null,
      level: first.level ?? null,
      faculty: first.faculty ?? null,
      continuousAssessmentWeightage: first.continuousAssessmentWeightage ?? null,
      examDuration: first.examDuration ?? null,
      levelCode: first.levelCode ?? null,
    });
    for (const occ of occList ?? []) {
      occurrences.push({ courseId, occurrenceNo: String(occ.occurence) });
      for (const a of occ.activities ?? []) {
        activities.push({
          courseId,
          occurrenceNo: String(occ.occurence),
          title: a.title ?? null,
          day: a.day ?? null,
          room: a.room ?? null,
          beginTime: a.begin_time ?? null,
          endTime: a.end_time ?? null,
          tutor: a.tutor ?? null,
          startDate: a.start_date ?? null,
          endDate: a.end_date ?? null,
        });
      }
    }
  }
  return { courses, occurrences, activities };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const jsonPath = process.argv[2] ?? DEFAULT_JSON;
  const appJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rows = appJsonToRows(appJson);
  const { db, close } = openDb(config.databaseUrl);
  try {
    await replaceAll(db, rows);
    console.log(
      `seeded from ${jsonPath}: ${rows.courses.length} courses, ${rows.occurrences.length} occurrences, ${rows.activities.length} activities`,
    );
  } finally {
    await close();
  }
}
