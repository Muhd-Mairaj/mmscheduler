import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { isClashing } from "../app/lib/clash.mjs";
import { solve } from "../app/lib/solver.mjs";
import { loadState, saveState } from "../app/lib/storage.mjs";
import { normalizeCourses, normalizeOccurrence, tutorsOf } from "../app/lib/normalize.mjs";
import { toMinutes, formatTime, formatRange } from "../app/lib/time.mjs";

const act = (day, begin_time, end_time, extra = {}) => ({
  title: "lecture", day, begin_time, end_time, tutor: "T", ...extra,
});
const occ = (course_id, occurence, activities) => ({ course_id, occurence, activities });

test("time helpers", () => {
  assert.equal(toMinutes("08:30"), 510);
  assert.equal(toMinutes("bad"), null);
  assert.equal(formatTime("13:05"), "1:05 PM");
  assert.equal(formatTime("00:00"), "12:00 AM");
});

test("formatRange is compact and unambiguous", () => {
  const f = (a, b) => formatRange(a, b).replace(/[\u200b\u00a0]/g, (c) => (c === "\u00a0" ? " " : ""));
  assert.equal(f("08:00", "10:00"), "8–10 AM");
  assert.equal(f("08:30", "10:00"), "8:30–10 AM");
  assert.equal(f("11:00", "13:00"), "11 AM–1 PM");
  assert.equal(f("11:00", "12:00"), "11 AM–12 PM");
  assert.equal(f("18:00", "21:00"), "6–9 PM");
});

test("class clashes: overlap yes, touching no, other day no", () => {
  const a = occ("A", "1", [act("Monday", "08:00", "10:00")]);
  assert.ok(isClashing(a, occ("B", "1", [act("Monday", "09:00", "11:00")])));
  assert.ok(!isClashing(a, occ("B", "1", [act("Monday", "10:00", "11:00")])));
  assert.ok(!isClashing(a, occ("B", "1", [act("Tuesday", "08:00", "10:00")])));
});

test("monday midnight start is still a valid time", () => {
  const a = occ("A", "1", [act("Monday", "00:00", "02:00")]);
  assert.ok(isClashing(a, occ("B", "1", [act("Monday", "01:00", "03:00")])));
});

test("exam clashes respect date and the allow flag", () => {
  const exam = (date) => ({ title: "exam", day: "Tuesday", begin_time: "14:00", end_time: "17:00", start_date: date });
  const a = occ("A", "1", [exam("05/01/2027")]);
  const same = occ("B", "1", [exam("05/01/2027")]);
  const other = occ("C", "1", [exam("06/01/2027")]);
  assert.ok(isClashing(a, same, false));
  assert.ok(!isClashing(a, same, true));
  assert.ok(!isClashing(a, other, false));
});

test("solver avoids clashes and honours preferences", () => {
  const courses = {
    A: [occ("A", "1", [act("Monday", "08:00", "10:00", { tutor: "X" })]),
        occ("A", "2", [act("Tuesday", "08:00", "10:00", { tutor: "Y" })])],
    B: [occ("B", "1", [act("Monday", "09:00", "11:00")])],
  };
  const { picks } = solve(courses, {});
  assert.deepEqual(picks.map((o) => o.occurence).sort(), ["2", "1"].sort());
  assert.equal(picks.find((o) => o.course_id === "A").occurence, "2");

  const pref = solve({ A: courses.A }, { preferredTutors: { A: ["X"] } });
  assert.equal(pref.picks[0].occurence, "1");
  const day = solve({ A: courses.A }, { avoidedDays: ["Monday"] });
  assert.equal(day.picks[0].occurence, "2");
});

test("solver reports impossible and honours locks", () => {
  const courses = {
    A: [occ("A", "1", [act("Monday", "08:00", "10:00")])],
    B: [occ("B", "1", [act("Monday", "09:00", "11:00")])],
  };
  assert.equal(solve(courses).picks, null);
  const two = { A: [occ("A", "1", [act("Monday", "08:00", "09:00")]), occ("A", "2", [act("Tuesday", "08:00", "09:00")])] };
  assert.equal(solve(two, {}, false, { A: "2" }).picks[0].occurence, "2");
});

test("solver stays fast on the real dataset's biggest courses", () => {
  const require = createRequire(import.meta.url);
  const data = require("../app/all_courses_updated_one_week_schedule_occ_separated.json");
  const biggest = Object.entries(data).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
  const t = Date.now();
  solve(Object.fromEntries(biggest), { avoidedDays: ["Friday"], compactDays: true });
  assert.ok(Date.now() - t < 5000);
});

test("storage round-trips and migrates legacy keys", () => {
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  mem.set("courses", JSON.stringify({ A: [] }));
  mem.set("selectedOccurences", JSON.stringify([{ course_id: "A", occurence: "3" }]));
  mem.set("isAllowExamClash", "true");
  const migrated = loadState(storage);
  assert.deepEqual(migrated, { courses: ["A"], selection: { A: "3" }, colors: {}, allowExamClash: true });
  saveState(migrated, storage);
  assert.ok(!mem.has("courses"));
  assert.deepEqual(loadState(storage), migrated);
  mem.set("mmscheduler:v2", "{not json");
  assert.deepEqual(loadState(storage).courses, []);
});

test("co-taught sessions are merged instead of duplicated", () => {
  const lecture = { title: "lecture", day: "Friday", room: "DK1", begin_time: "08:00", end_time: "10:00" };
  const merged = normalizeOccurrence(
    occ("KIB2012", "1", [
      { ...lecture, tutor: "DR. A" },
      { ...lecture, tutor: "DR. B" },
      { ...lecture },
      { ...lecture, tutor: "DR. A" },
    ])
  );
  assert.equal(merged.activities.length, 1);
  assert.deepEqual(tutorsOf(merged.activities[0]), ["DR. A", "DR. B"]);
  // different slot or room stays separate
  const two = normalizeOccurrence(occ("X", "1", [lecture, { ...lecture, begin_time: "10:00", end_time: "12:00" }, { ...lecture, room: "DK2" }]));
  assert.equal(two.activities.length, 3);
});

test("real dataset has no duplicate activities after normalising", () => {
  const require = createRequire(import.meta.url);
  const data = normalizeCourses(require("../app/all_courses_updated_one_week_schedule_occ_separated.json"));
  for (const occs of Object.values(data)) {
    for (const o of occs) {
      const keys = o.activities.map((a) => [a.title, a.day, a.begin_time, a.end_time, a.start_date, a.room].join("|"));
      assert.equal(new Set(keys).size, keys.length, `${o.course_id} occ ${o.occurence}`);
    }
  }
});

const OCR_SAMPLE = `Registered Modules for 2026/2027 Semester 1
Module Code               12 Module Name                    Credit                              Occurrence                                        Registration Status
GIG1013                             Appreciation Of Ethics And      22                                        6                                                          Enrolled
Civilisations
KIB2009                         Biomedical Engineering Lab     2                                  2                                                  Enrolled
2
KiB2012                         Biomedical Engineering         2                                  2                                                  Enrolled
Design 1
KIB2014                            Numerical Methods And          21                                       2                                                        Enrolled
Programming
KIB2O10                         Biomedical Engineering,         3                                  1                                                  Enrolled
ZZZ9999                         Nothing                         3                                  1                                                  Enrolled
Total credit hours: 17`;

test("enrollment table text -> modules + occurrences", async () => {
  const { extractRows, candidateCodes, resolveRows, codeVariants } = await import("../app/lib/enrollment.mjs");
  assert.ok(codeVariants("KIB2O10").includes("KIB2010"));
  assert.deepEqual(codeVariants("Appreciation"), []);

  const rows = extractRows(OCR_SAMPLE);
  assert.equal(rows.length, 6);
  const mk = (code, occs) => occs.map((n) => ({ module: code + " name", credits: 2, occurence: n }));
  const data = { GIG1013: mk("G", ["1", "6"]), KIB2009: mk("K9", ["1", "2"]), KIB2012: mk("K12", ["2"]), KIB2014: mk("K14", ["1", "2"]), KIB2010: mk("K10", ["1"]) };
  assert.ok(candidateCodes(rows).includes("KIB2012"));
  const items = resolveRows(rows, data);
  const by = Object.fromEntries(items.map((i) => [i.code, i]));
  assert.equal(by.GIG1013.occurrence, "6"); // stray "22" credit digits ignored
  assert.equal(by.KIB2009.occurrence, "2");
  assert.equal(by.KIB2012.occurrence, "2"); // "KiB2012" case slip
  assert.equal(by.KIB2014.occurrence, "2");
  assert.equal(by.KIB2010.occurrence, "1"); // "KIB2O10" digit look-alikes fixed
  assert.equal(by.ZZZ9999.state, "unknown");
});

test("plan: add/remove/toggle keep colours stable and selections consistent", async () => {
  const Plan = await import("../app/lib/plan.mjs");
  let plan = Plan.emptyPlan();
  for (const c of ["A", "B", "C"]) plan = Plan.addCourse(plan, c);
  assert.deepEqual(plan.colors, { A: 0, B: 1, C: 2 });
  assert.equal(Plan.addCourse(plan, "A"), plan); // idempotent

  plan = Plan.removeCourse(plan, "B");
  plan = Plan.addCourse(plan, "D");
  assert.equal(plan.colors.D, 1); // reuses the freed colour, others untouched
  assert.equal(plan.colors.C, 2);

  const o = occ("A", "2", [act("Monday", "08:00", "09:00")]);
  plan = Plan.toggleOccurrence(plan, o);
  assert.equal(plan.selection.A, "2");
  plan = Plan.toggleOccurrence(plan, o);
  assert.equal("A" in plan.selection, false);
});

test("plan: importItems skips picks that clash and reports them", async () => {
  const Plan = await import("../app/lib/plan.mjs");
  const a1 = occ("A", "1", [act("Monday", "08:00", "10:00")]);
  const b1 = occ("B", "1", [act("Monday", "09:00", "11:00")]);
  const c1 = occ("C", "1", [act("Tuesday", "09:00", "11:00")]);
  const items = [
    { code: "A", occurrences: [a1], occurrence: "1" },
    { code: "B", occurrences: [b1], occurrence: "1" },
    { code: "C", occurrences: [c1], occurrence: null },
  ];
  const { plan, data, skipped } = Plan.importItems(Plan.emptyPlan(), {}, items);
  assert.deepEqual(plan.courses, ["A", "B", "C"]);
  assert.deepEqual(plan.selection, { A: "1" });
  assert.deepEqual(skipped, ["B"]);
  assert.ok(data.C);
});

test("plan: turning exam clashes off drops the later clashing exam", async () => {
  const Plan = await import("../app/lib/plan.mjs");
  const exam = (id, code) => occ(code, id, [{ title: "exam", day: "Tuesday", begin_time: "14:00", end_time: "17:00", start_date: "05/01/2027" }]);
  const data = { A: [exam("1", "A")], B: [exam("1", "B")] };
  let plan = { ...Plan.emptyPlan(), courses: ["A", "B"], selection: { A: "1", B: "1" }, allowExamClash: true };
  plan = Plan.setAllowExamClash(plan, data, false);
  assert.deepEqual(plan.selection, { A: "1" });
});
