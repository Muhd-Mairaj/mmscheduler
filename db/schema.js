// Shared Drizzle schema — the single source of truth for timetable data.
//
// Plain JavaScript (not TypeScript) on purpose: it is imported by both the
// Next.js app and the plain-Node scraper (node run.mjs / scheduler.mjs),
// so it must load without a TS compiler.
//
// Tables mirror the app's JSON shape 1:1, fully normalized:
//   courses      one row per module code (course_id PK)
//   occurrences  one row per (course_id, occurrence_no); the app's "occurence" list
//   activities   one row per class session (lecture/tutorial/lab/..., incl. exams)
//
// There is intentionally no lecturers table: the app only ever displays the
// tutor *string*, so it is stored denormalized on the activity row. No
// translation layers, no intermediate files.
import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  courseId: text('course_id').primaryKey(),
  module: text('module'),
  credits: integer('credits'),
  yearPeriod: text('year_period'),
  overallTargetStudent: integer('overall_target_student'),
  level: text('level'),
  faculty: text('faculty'),
  continuousAssessmentWeightage: text('continuous_assessment_weightage'),
  examDuration: integer('exam_duration'),
  levelCode: integer('level_code'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const occurrences = pgTable(
  'occurrences',
  {
    id: serial('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.courseId, { onDelete: 'cascade' }),
    occurrenceNo: text('occurrence_no').notNull(),
  },
  (t) => [uniqueIndex('occurrences_course_occ_uq').on(t.courseId, t.occurrenceNo)],
);

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  occurrenceId: integer('occurrence_id')
    .notNull()
    .references(() => occurrences.id, { onDelete: 'cascade' }),
  title: text('title'),
  day: text('day'),
  room: text('room'),
  beginTime: text('begin_time'),
  endTime: text('end_time'),
  tutor: text('tutor'),
  startDate: text('start_date'),
  endDate: text('end_date'),
});
