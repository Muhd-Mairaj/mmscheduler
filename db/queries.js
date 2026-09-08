// Shared read queries. Both API routes use these, so the JSON shape the
// frontend receives is defined exactly once, here.
//
// Returned shapes are identical to the old
// all_courses_updated_one_week_schedule_occ_separated.json format:
//   { [courseId]: [ { module, course_id, credits, yearPeriod,
//                     overallTargetStudent, level, faculty,
//                     continuousAssessmentWeightage, examDuration, levelCode,
//                     occurence, activities: [ { title, day, room, begin_time,
//                     end_time, tutor?, start_date?, end_date? } ] } ] }
import { asc, ilike, inArray, or, sql } from 'drizzle-orm';
import { activities, courses, occurrences } from './schema.js';

function toOccurrence(course, occRows, actByOccId) {
  return {
    module: course.module,
    course_id: course.courseId,
    credits: course.credits,
    yearPeriod: course.yearPeriod,
    overallTargetStudent: course.overallTargetStudent,
    level: course.level,
    faculty: course.faculty,
    continuousAssessmentWeightage: course.continuousAssessmentWeightage,
    examDuration: course.examDuration,
    levelCode: course.levelCode,
    occurence: occRows.occurrenceNo,
    activities: (actByOccId.get(occRows.id) ?? []).map((a) => {
      const out = {
        title: a.title,
        day: a.day,
        room: a.room,
        begin_time: a.beginTime,
        end_time: a.endTime,
      };
      if (a.tutor != null) out.tutor = a.tutor;
      if (a.title === 'exam') {
        if (a.startDate != null) out.start_date = a.startDate;
        if (a.endDate != null) out.end_date = a.endDate;
      }
      return out;
    }),
  };
}

// Occurrence numbers are numeric strings ("1", "2", ...); sort them the same
// way the old transform did so card order is unchanged.
function occSort(a, b) {
  return String(a.occurence).padStart(2, ' ') < String(b.occurence).padStart(2, ' ') ? -1 : 1;
}

async function fetchAsAppJson(db, courseIds) {
  if (courseIds.length === 0) return {};
  const courseRows = await db.select().from(courses).where(inArray(courses.courseId, courseIds));
  const occRows = await db
    .select()
    .from(occurrences)
    .where(inArray(occurrences.courseId, courseIds))
    .orderBy(asc(occurrences.courseId), asc(occurrences.id));
  const occIds = occRows.map((o) => o.id);
  const actRows =
    occIds.length === 0
      ? []
      : await db
          .select()
          .from(activities)
          .where(inArray(activities.occurrenceId, occIds))
          .orderBy(asc(activities.id));

  const actByOccId = new Map();
  for (const a of actRows) {
    if (!actByOccId.has(a.occurrenceId)) actByOccId.set(a.occurrenceId, []);
    actByOccId.get(a.occurrenceId).push(a);
  }
  const courseById = new Map(courseRows.map((c) => [c.courseId, c]));

  const out = {};
  for (const id of courseIds) {
    const course = courseById.get(id);
    if (!course) continue;
    out[id] = occRows
      .filter((o) => o.courseId === id)
      .map((o) => toOccurrence(course, o, actByOccId))
      .sort(occSort);
  }
  return out;
}

export async function getCoursesByIds(db, ids) {
  const clean = [...new Set(ids.map((s) => s.trim()).filter(Boolean))];
  return fetchAsAppJson(db, clean);
}

export async function searchCourses(db, query, page, limit) {
  const q = `%${query.toLowerCase()}%`;
  const where = or(ilike(courses.courseId, q), ilike(courses.module, q));

  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(courses)
    .where(where);
  const total = count ?? 0;

  const rows = await db
    .select({ courseId: courses.courseId })
    .from(courses)
    .where(where)
    .orderBy(asc(courses.courseId))
    .limit(limit)
    .offset((page - 1) * limit);

  const results = await fetchAsAppJson(
    db,
    rows.map((r) => r.courseId),
  );
  return { results, total };
}
