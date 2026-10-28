"use client";

import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal";
import { DAYS } from "../lib/time.mjs";
import { toTitleCase } from "../lib/text.mjs";
import { tutorsOf } from "../lib/normalize.mjs";
import runSolver from "../lib/runSolver";
import classes from "./SchedulerDialog.module.css";

const PRIORITIES = {
  lecturers: { label: "Lecturers", weights: { tutor: 5, day: 2, time: 2 } },
  balanced: { label: "Balanced", weights: { tutor: 3, day: 3, time: 2 } },
  days: { label: "Days & times", weights: { tutor: 2, day: 5, time: 4 } },
};

const TIMES = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

const label = (time) => {
  const h = Number(time.slice(0, 2));
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? "PM" : "AM"}`;
};

export default function SchedulerDialog({
  open,
  onClose,
  courses,
  courseData,
  selection,
  allowExamClash,
  onApply,
}) {
  // tutorPrefs[courseId][tutor] = "like" | "avoid"
  const [tutorPrefs, setTutorPrefs] = useState({});
  const [avoidedDays, setAvoidedDays] = useState([]);
  const [earliestStart, setEarliestStart] = useState("");
  const [latestEnd, setLatestEnd] = useState("");
  const [compactDays, setCompactDays] = useState(false);
  const [priority, setPriority] = useState("balanced");
  const [keepPicked, setKeepPicked] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const job = useRef(null);

  useEffect(() => () => job.current?.cancel(), []);

  const handleClose = () => {
    if (running) return;
    setError("");
    onClose();
  };

  const tutors = useMemo(() => {
    const result = {};
    for (const code of courses) {
      const set = new Set();
      for (const occ of courseData[code] ?? []) {
        for (const a of occ.activities) {
          if (a.title !== "exam") tutorsOf(a).forEach((t) => set.add(t));
        }
      }
      result[code] = [...set].sort();
    }
    return result;
  }, [courses, courseData]);

  const cycle = (code, tutor) =>
    setTutorPrefs((prev) => {
      const current = prev[code]?.[tutor];
      const next = current === undefined ? "like" : current === "like" ? "avoid" : undefined;
      const forCourse = { ...prev[code] };
      if (next) forCourse[tutor] = next;
      else delete forCourse[tutor];
      return { ...prev, [code]: forCourse };
    });

  const toggleDay = (day) =>
    setAvoidedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const generate = async () => {
    setRunning(true);
    setError("");

    const preferredTutors = {};
    const avoidedTutors = {};
    for (const code of courses) {
      const entries = Object.entries(tutorPrefs[code] ?? {});
      preferredTutors[code] = entries.filter(([, v]) => v === "like").map(([t]) => t);
      avoidedTutors[code] = entries.filter(([, v]) => v === "avoid").map(([t]) => t);
    }

    job.current = runSolver({
      courses: Object.fromEntries(courses.map((c) => [c, courseData[c] ?? []])),
      prefs: {
        preferredTutors,
        avoidedTutors,
        avoidedDays,
        earliestStart: earliestStart || null,
        latestEnd: latestEnd || null,
        compactDays,
        weights: PRIORITIES[priority].weights,
      },
      allowExamClash,
      locked: keepPicked ? selection : {},
    });

    try {
      const { picks, truncated } = await job.current.promise;
      if (!picks) {
        setError(
          "No clash-free combination exists for these modules. Remove a module, or allow exam clashes, and try again."
        );
      } else {
        onApply(picks, truncated);
        onClose();
      }
    } catch (err) {
      setError(`Something went wrong while scheduling: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Auto-schedule"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={running}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={running}>
            <Sparkles size={16} />
            {running ? "Finding best schedule…" : "Generate schedule"}
          </button>
        </>
      }
    >
      <p className={classes.intro}>
        Finds the best clash-free combination for all {courses.length} module{courses.length === 1 ? "" : "s"}{" "}
        using your preferences. It runs entirely in your browser.
      </p>

      <section className={classes.section}>
        <h3>Days off</h3>
        <p className={classes.help}>Classes on these days are avoided where possible.</p>
        <div className={classes.chips}>
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`${classes.pill} ${avoidedDays.includes(day) ? classes.pillOn : ""}`}
              aria-pressed={avoidedDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </section>

      <section className={classes.section}>
        <h3>Preferred hours</h3>
        <div className={classes.row}>
          <label>
            <span className="field-label">Start no earlier than</span>
            <select className={classes.select} value={earliestStart} onChange={(e) => setEarliestStart(e.target.value)}>
              <option value="">No preference</option>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Finish no later than</span>
            <select className={classes.select} value={latestEnd} onChange={(e) => setLatestEnd(e.target.value)}>
              <option value="">No preference</option>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={classes.switchRow}>
          <span>
            <strong>Fewer campus days</strong>
            <span className={classes.help}>Prefer packing classes into fewer days.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={compactDays}
            className="toggle"
            onClick={() => setCompactDays((v) => !v)}
            aria-label="Prefer fewer campus days"
          />
        </label>
      </section>

      <section className={classes.section}>
        <h3>Lecturers</h3>
        <p className={classes.help}>
          Tap a name once to prefer (<ThumbsUp size={12} />), twice to avoid (<ThumbsDown size={12} />), again to clear.
        </p>
        <div className={classes.courseTutors}>
          {courses.map((code) => (
            <div key={code} className={classes.courseBlock}>
              <div className={classes.courseTitle}>
                <span className={classes.code}>{code}</span> {courseData[code]?.[0]?.module}
              </div>
              <div className={classes.chips}>
                {tutors[code].length === 0 && <span className={classes.help}>No lecturer information.</span>}
                {tutors[code].map((tutor) => {
                  const state = tutorPrefs[code]?.[tutor];
                  return (
                    <button
                      key={tutor}
                      type="button"
                      className={`${classes.tutor} ${state === "like" ? classes.like : ""} ${state === "avoid" ? classes.avoid : ""}`}
                      onClick={() => cycle(code, tutor)}
                      aria-label={`${toTitleCase(tutor)}: ${state ?? "no preference"}`}
                    >
                      {state === "like" && <ThumbsUp size={12} />}
                      {state === "avoid" && <ThumbsDown size={12} />}
                      {toTitleCase(tutor)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={classes.section}>
        <h3>What matters most?</h3>
        <div className={classes.segmented} role="radiogroup" aria-label="Priority">
          {Object.entries(PRIORITIES).map(([key, { label: text }]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={priority === key}
              className={`${classes.segment} ${priority === key ? classes.segmentOn : ""}`}
              onClick={() => setPriority(key)}
            >
              {text}
            </button>
          ))}
        </div>
        <label className={classes.switchRow}>
          <span>
            <strong>Keep my current picks</strong>
            <span className={classes.help}>Only fill in modules that don’t have an occurrence yet.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={keepPicked}
            className="toggle"
            onClick={() => setKeepPicked((v) => !v)}
            aria-label="Keep current picks"
          />
        </label>
      </section>

      {error && (
        <p className={classes.error} role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
