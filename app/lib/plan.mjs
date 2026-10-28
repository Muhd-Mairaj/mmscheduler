import { isClashing } from "./clash.mjs";

/**
 * Pure planner logic. A plan is:
 *   { courses: string[], selection: {code: occurrence}, colors: {code: n}, allowExamClash: boolean }
 * and `data` maps course code -> occurrences. Kept free of React so it is easy to test.
 */

export const COLOR_COUNT = 10;

export const emptyPlan = () => ({ courses: [], selection: {}, colors: {}, allowExamClash: false });

/** Lowest module colour not already used, so removing a module doesn't recolour the rest. */
export const nextColor = (colors, courses) => {
  const used = new Set(courses.map((c) => colors[c]));
  for (let i = 0; i < COLOR_COUNT; i++) if (!used.has(i)) return i;
  return courses.length % COLOR_COUNT;
};

/** Keep selections in course order, dropping any that clash with an earlier one. */
export const pruneClashes = (courses, data, selection, allowExamClash) => {
  const kept = {};
  const keptOccurrences = [];
  for (const code of courses) {
    const occurrence = data[code]?.find((o) => o.occurence === selection[code]);
    if (!occurrence) continue;
    if (keptOccurrences.some((k) => isClashing(k, occurrence, allowExamClash))) continue;
    kept[code] = occurrence.occurence;
    keptOccurrences.push(occurrence);
  }
  return kept;
};

export const addCourse = (plan, code) =>
  plan.courses.includes(code)
    ? plan
    : {
        ...plan,
        courses: [...plan.courses, code],
        colors: { ...plan.colors, [code]: nextColor(plan.colors, plan.courses) },
      };

export const removeCourse = (plan, code) => {
  const { [code]: _selection, ...selection } = plan.selection;
  const { [code]: _color, ...colors } = plan.colors;
  return { ...plan, courses: plan.courses.filter((c) => c !== code), selection, colors };
};

/** Pick, swap to, or (if already picked) unpick an occurrence. */
export const toggleOccurrence = (plan, occurrence) => {
  const { course_id: code, occurence } = occurrence;
  if (plan.selection[code] === occurence) {
    const { [code]: _removed, ...selection } = plan.selection;
    return { ...plan, selection };
  }
  return { ...plan, selection: { ...plan.selection, [code]: occurence } };
};

export const setAllowExamClash = (plan, data, allow) => ({
  ...plan,
  allowExamClash: allow,
  // Turning the allowance off may leave clashing exams selected: drop the later ones.
  selection: allow ? plan.selection : pruneClashes(plan.courses, data, plan.selection, false),
});

export const applySchedule = (plan, picks) => ({
  ...plan,
  selection: Object.fromEntries(picks.map((o) => [o.course_id, o.occurence])),
});

/**
 * Add several modules at once (e.g. from an enrollment screenshot) and pick
 * their occurrences. items: [{ code, occurrences, occurrence|null }].
 * Returns the new plan, the merged data, and the codes whose pick was skipped
 * because it would clash with an earlier module.
 */
export const importItems = (plan, data, items) => {
  const merged = { ...data, ...Object.fromEntries(items.map((i) => [i.code, i.occurrences])) };
  const withCourses = items.reduce((p, item) => addCourse(p, item.code), plan);

  const wanted = { ...plan.selection };
  for (const item of items) if (item.occurrence) wanted[item.code] = item.occurrence;
  const selection = pruneClashes(withCourses.courses, merged, wanted, plan.allowExamClash);

  const skipped = items.filter((i) => i.occurrence && selection[i.code] !== i.occurrence).map((i) => i.code);
  return { plan: { ...withCourses, selection }, data: merged, skipped };
};

/** Map of "course|occurrence" -> codes of the selected modules that block it. */
export const blockedOccurrences = (plan, data, selectedOccurrences) => {
  const map = new Map();
  for (const picked of selectedOccurrences) {
    for (const code of plan.courses) {
      if (code === picked.course_id) continue;
      for (const occurrence of data[code] ?? []) {
        if (!isClashing(picked, occurrence, plan.allowExamClash)) continue;
        const key = `${occurrence.course_id}|${occurrence.occurence}`;
        map.set(key, [...(map.get(key) ?? []), picked.course_id]);
      }
    }
  }
  return map;
};
