import { emptyPlan } from "./plan.mjs";

const KEY = "mmscheduler:v2";
const LEGACY_KEYS = [
  "courses",
  "selectedOccurences",
  "disabledOccurences",
  "isAllowExamClash",
];


const read = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

const migrateLegacy = (storage) => {
  const courses = read(storage, "courses");
  if (!courses || typeof courses !== "object") return null;
  const selected = read(storage, "selectedOccurences");
  const selection = {};
  if (Array.isArray(selected)) {
    for (const occ of selected) {
      if (occ?.course_id && occ?.occurence) selection[occ.course_id] = String(occ.occurence);
    }
  }
  return {
    courses: Object.keys(courses),
    selection,
    colors: {},
    allowExamClash: read(storage, "isAllowExamClash") === true,
  };
};

export const loadState = (storage = globalThis.localStorage) => {
  try {
    const saved = read(storage, KEY);
    if (saved && Array.isArray(saved.courses)) {
      return {
        courses: saved.courses.filter((c) => typeof c === "string"),
        selection:
          saved.selection && typeof saved.selection === "object" ? saved.selection : {},
        colors: saved.colors && typeof saved.colors === "object" ? saved.colors : {},
        allowExamClash: saved.allowExamClash === true,
      };
    }
    return migrateLegacy(storage) ?? emptyPlan();
  } catch {
    return emptyPlan();
  }
};

export const saveState = (state, storage = globalThis.localStorage) => {
  try {
    storage.setItem(KEY, JSON.stringify(state));
    // Legacy keys are now redundant; remove only ours (never the theme).
    for (const key of LEGACY_KEYS) storage.removeItem(key);
  } catch {
    /* storage unavailable or full: planner still works in-memory */
  }
};

export const clearState = (storage = globalThis.localStorage) => {
  try {
    storage.removeItem(KEY);
    for (const key of LEGACY_KEYS) storage.removeItem(key);
  } catch {
    /* ignore */
  }
};
