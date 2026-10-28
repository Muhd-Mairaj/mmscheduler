import { dayIndex, isExam, parseDate, toMinutes } from "./time.mjs";

const cache = new WeakMap();

/** Normalised, comparison-ready view of an occurrence's activities. */
export const getSlots = (occurrence) => {
  let slots = cache.get(occurrence);
  if (slots) return slots;

  const classes = [];
  const exams = [];
  for (const activity of occurrence.activities ?? []) {
    const start = toMinutes(activity.begin_time);
    const end = toMinutes(activity.end_time);
    if (start === null || end === null) continue;
    if (isExam(activity)) {
      const date = parseDate(activity.start_date);
      if (date) exams.push({ date: date.getTime(), start, end });
    } else {
      const day = dayIndex(activity.day);
      if (day >= 0) classes.push({ day, start, end });
    }
  }
  slots = { classes, exams };
  cache.set(occurrence, slots);
  return slots;
};

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/**
 * Do two occurrences clash? Classes clash when they overlap on the same
 * weekday; exams clash when they overlap on the same date (unless allowed).
 */
export const isClashing = (a, b, allowExamClash = false) => {
  const sa = getSlots(a);
  const sb = getSlots(b);

  for (const x of sa.classes) {
    for (const y of sb.classes) {
      if (x.day === y.day && overlaps(x, y)) return true;
    }
  }
  if (!allowExamClash) {
    for (const x of sa.exams) {
      for (const y of sb.exams) {
        if (x.date === y.date && overlaps(x, y)) return true;
      }
    }
  }
  return false;
};
