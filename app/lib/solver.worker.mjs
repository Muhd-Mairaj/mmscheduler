import { solve } from "./solver.mjs";

self.onmessage = (event) => {
  const { courses, prefs, allowExamClash, locked } = event.data;
  try {
    self.postMessage({ ok: true, result: solve(courses, prefs, allowExamClash, locked) });
  } catch (error) {
    self.postMessage({ ok: false, error: String(error?.message ?? error) });
  }
};
