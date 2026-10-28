"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Plan from "../lib/plan.mjs";
import { clearState, loadState, saveState } from "../lib/storage.mjs";

/** The persisted plan plus the (never persisted) course data it refers to. */
const initial = { ...Plan.emptyPlan(), data: {} };
const persistable = ({ data: _data, ...plan }) => plan;

export default function usePlanner() {
  const [state, setState] = useState(initial);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const canPersist = useRef(false);

  // Restore the saved plan, refetching course data so it is never stale.
  useEffect(() => {
    const controller = new AbortController();
    const saved = loadState();

    const hydrate = async () => {
      let data = {};
      try {
        if (saved.courses.length > 0) {
          const res = await fetch(
            "/api/get-courses-by-ids?query=" + encodeURIComponent(saved.courses.join(",")),
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
        }
      } catch (err) {
        // Leave the saved plan untouched on disk so a reload can recover it.
        if (err.name !== "AbortError") setStatus("error");
        return;
      }
      const courses = saved.courses.filter((code) => data[code]);
      const selection = Plan.pruneClashes(courses, data, saved.selection, saved.allowExamClash);
      setState({ ...saved, courses, selection, data });
      setStatus("ready");
      canPersist.current = true;
    };
    hydrate();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (canPersist.current) saveState(persistable(state));
  }, [state]);

  const { courses, selection, allowExamClash, colors, data } = state;

  const selectedOccurrences = useMemo(
    () => courses.map((code) => data[code]?.find((o) => o.occurence === selection[code])).filter(Boolean),
    [courses, data, selection]
  );

  const blocked = useMemo(
    () => Plan.blockedOccurrences(state, data, selectedOccurrences),
    [state, data, selectedOccurrences]
  );

  const credits = useMemo(
    () => selectedOccurrences.reduce((sum, o) => sum + (Number(o.credits) || 0), 0),
    [selectedOccurrences]
  );

  const addCourse = useCallback((code, occurrences) => {
    setState((prev) => Plan.addCourse({ ...prev, data: { ...prev.data, [code]: occurrences } }, code));
  }, []);

  const removeCourse = useCallback((code) => setState((prev) => Plan.removeCourse(prev, code)), []);

  const toggleOccurrence = useCallback(
    (occurrence) => {
      const key = `${occurrence.course_id}|${occurrence.occurence}`;
      // Blocked occurrences are disabled in the UI; this guards against stale clicks.
      if (selection[occurrence.course_id] !== occurrence.occurence && blocked.has(key)) return;
      setState((prev) => Plan.toggleOccurrence(prev, occurrence));
    },
    [selection, blocked]
  );

  const setAllowExamClash = useCallback(
    (allow) => setState((prev) => Plan.setAllowExamClash(prev, prev.data, allow)),
    []
  );

  const applySchedule = useCallback((picks) => setState((prev) => Plan.applySchedule(prev, picks)), []);

  /** Returns the codes whose occurrence couldn't be selected because it clashes. */
  const importPlan = useCallback(
    (items) => {
      const result = Plan.importItems(state, state.data, items);
      setState({ ...result.plan, data: result.data });
      return result.skipped;
    },
    [state]
  );

  const clearSelection = useCallback(() => setState((prev) => ({ ...prev, selection: {} })), []);

  const clearAll = useCallback(() => {
    setState((prev) => ({ ...initial, allowExamClash: prev.allowExamClash }));
    clearState();
  }, []);

  return {
    status,
    courses,
    courseData: data,
    selection,
    colors,
    allowExamClash,
    selectedOccurrences,
    blocked,
    credits,
    addCourse,
    removeCourse,
    toggleOccurrence,
    setAllowExamClash,
    applySchedule,
    importPlan,
    clearSelection,
    clearAll,
  };
}
