import { isClashing, getSlots } from "./clash.mjs";
import { dayIndex, isExam, toMinutes } from "./time.mjs";
import { tutorsOf } from "./normalize.mjs";

/**
 * Preferences:
 *  preferredTutors / avoidedTutors: { [courseId]: string[] }
 *  avoidedDays: string[]            e.g. ["Friday"]
 *  earliestStart / latestEnd: "HH:MM" | null
 *  compactDays: boolean             prefer fewer distinct campus days
 *  weights: { tutor, day, time }    relative importance
 */
export const DEFAULT_WEIGHTS = { tutor: 3, day: 3, time: 2 };

const NODE_LIMIT = 3_000_000;

const scoreOccurrence = (occurrence, prefs) => {
  const weights = { ...DEFAULT_WEIGHTS, ...prefs.weights };
  const preferred = prefs.preferredTutors?.[occurrence.course_id] ?? [];
  const avoided = prefs.avoidedTutors?.[occurrence.course_id] ?? [];
  const avoidedDays = new Set((prefs.avoidedDays ?? []).map((d) => dayIndex(d)));
  const earliest = prefs.earliestStart ? toMinutes(prefs.earliestStart) : null;
  const latest = prefs.latestEnd ? toMinutes(prefs.latestEnd) : null;

  let score = 0;
  const tutorsSeen = new Set();
  for (const activity of occurrence.activities ?? []) {
    if (isExam(activity)) continue;
    for (const tutor of tutorsOf(activity)) {
      if (tutorsSeen.has(tutor)) continue;
      tutorsSeen.add(tutor);
      if (preferred.includes(tutor)) score += weights.tutor;
      else if (avoided.includes(tutor)) score -= weights.tutor;
    }
    if (avoidedDays.has(dayIndex(activity.day))) score -= weights.day;
    const start = toMinutes(activity.begin_time);
    const end = toMinutes(activity.end_time);
    if (earliest !== null && start !== null && start < earliest) score -= weights.time;
    if (latest !== null && end !== null && end > latest) score -= weights.time;
  }
  return score;
};

const dayMask = (occurrence) => {
  let mask = 0;
  for (const slot of getSlots(occurrence).classes) mask |= 1 << slot.day;
  return mask;
};

const popcount = (n) => {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
};

/**
 * Finds the best clash-free pick of one occurrence per course using
 * branch-and-bound (so it stays fast even with large occurrence counts).
 *
 * @param {Object<string, object[]>} courses  courseId -> occurrences
 * @param {object} prefs
 * @param {boolean} allowExamClash
 * @param {Object<string,string>} locked      courseId -> occurrence number to force
 * @returns {{ picks: object[]|null, score: number, truncated: boolean }}
 */
export const solve = (courses, prefs = {}, allowExamClash = false, locked = {}) => {
  const compactWeight = prefs.compactDays ? 2 : 0;

  const groups = Object.entries(courses)
    .map(([courseId, occurrences]) => {
      const pool = locked[courseId]
        ? occurrences.filter((o) => o.occurence === locked[courseId])
        : occurrences;
      const options = pool
        .map((occurrence) => ({
          occurrence,
          score: scoreOccurrence(occurrence, prefs),
          mask: dayMask(occurrence),
        }))
        .sort((a, b) => b.score - a.score);
      return { courseId, options };
    })
    // Most constrained first: fewest options fail fastest.
    .sort((a, b) => a.options.length - b.options.length);

  if (groups.some((g) => g.options.length === 0)) {
    return { picks: null, score: -Infinity, truncated: false };
  }

  // bestRemaining[i] = optimistic score from groups i..end.
  const bestRemaining = new Array(groups.length + 1).fill(0);
  for (let i = groups.length - 1; i >= 0; i--) {
    bestRemaining[i] = bestRemaining[i + 1] + groups[i].options[0].score;
  }

  let best = null;
  let bestScore = -Infinity;
  let nodes = 0;
  let truncated = false;
  const chosen = [];

  const visit = (index, additive, mask) => {
    if (truncated) return;
    if (index === groups.length) {
      const total = additive - compactWeight * popcount(mask);
      if (total > bestScore) {
        bestScore = total;
        best = chosen.map((o) => o.occurrence);
      }
      return;
    }
    if (additive + bestRemaining[index] <= bestScore) return;

    for (const option of groups[index].options) {
      if (++nodes > NODE_LIMIT) {
        truncated = true;
        return;
      }
      if (additive + option.score + bestRemaining[index + 1] <= bestScore) break;
      let ok = true;
      for (const other of chosen) {
        if (isClashing(option.occurrence, other.occurrence, allowExamClash)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      chosen.push(option);
      visit(index + 1, additive + option.score, mask | option.mask);
      chosen.pop();
    }
  };

  visit(0, 0, 0);
  return { picks: best, score: bestScore, truncated };
};
