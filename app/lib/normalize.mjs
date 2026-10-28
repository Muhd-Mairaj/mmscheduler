/**
 * The source data lists a co-taught session once per lecturer (and sometimes
 * once more with no lecturer), so one class shows up as several identical
 * activities. Merge those into a single activity with a `tutors` list.
 */
export const normalizeOccurrence = (occurrence) => {
  const merged = new Map();
  for (const activity of occurrence.activities ?? []) {
    const key = [
      activity.title,
      activity.day,
      activity.begin_time,
      activity.end_time,
      activity.start_date ?? "",
      activity.end_date ?? "",
      activity.room ?? "",
    ].join("|");

    let entry = merged.get(key);
    if (!entry) {
      const { tutor, ...rest } = activity;
      entry = { ...rest, tutors: [] };
      merged.set(key, entry);
    }
    const tutor = activity.tutor?.trim();
    if (tutor && !entry.tutors.includes(tutor)) entry.tutors.push(tutor);
  }
  return { ...occurrence, activities: [...merged.values()] };
};

export const normalizeCourses = (raw) =>
  Object.fromEntries(
    Object.entries(raw).map(([code, occurrences]) => [code, occurrences.map(normalizeOccurrence)])
  );

/** Lecturers of an activity, tolerant of un-normalised data. */
export const tutorsOf = (activity) =>
  activity?.tutors ?? (activity?.tutor ? [activity.tutor] : []);
