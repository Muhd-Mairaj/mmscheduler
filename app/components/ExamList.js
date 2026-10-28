"use client";

import { CalendarClock, MapPin, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { formatTime, isExam, parseDate, toMinutes } from "../lib/time.mjs";
import classes from "./ExamList.module.css";

export default function ExamList({ occurrences, colors }) {
  const exams = useMemo(() => {
    const list = [];
    for (const occ of occurrences) {
      for (const a of occ.activities) {
        if (!isExam(a)) continue;
        const date = parseDate(a.start_date);
        const start = toMinutes(a.begin_time);
        const end = toMinutes(a.end_time);
        if (!date || start === null || end === null) continue;
        list.push({
          id: `${occ.course_id}|${occ.occurence}|${a.start_date}|${a.begin_time}`,
          courseId: occ.course_id,
          name: occ.module,
          occurrence: occ.occurence,
          room: a.room,
          date,
          start,
          end,
        });
      }
    }
    list.sort((a, b) => a.date - b.date || a.start - b.start);
    // Flag exams that overlap another exam on the same date.
    for (const x of list) {
      x.clash = list.some(
        (y) => y !== x && y.date.getTime() === x.date.getTime() && x.start < y.end && y.start < x.end
      );
    }
    return list;
  }, [occurrences]);

  if (exams.length === 0) return null;

  return (
    <section className={classes.wrap} aria-label="Exam schedule">
      <h2 className={classes.title}>
        <CalendarClock size={18} /> Exams
        <span className="chip">{exams.length}</span>
      </h2>
      <ul className={classes.list}>
        {exams.map((e) => (
          <li key={e.id} className={`course-${colors[e.courseId] ?? 0} ${classes.item}`}>
            <div className={classes.date}>
              <span className={classes.weekday}>{e.date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <span className={classes.day}>{e.date.getDate()}</span>
              <span className={classes.month}>{e.date.toLocaleDateString("en-GB", { month: "short" })}</span>
            </div>
            <div className={classes.info}>
              <div className={classes.name}>
                <span className={classes.code}>{e.courseId}</span> {e.name}
              </div>
              <div className={classes.meta}>
                <span>
                  {formatTime(e.start)} – {formatTime(e.end)}
                </span>
                {e.room && (
                  <span className={classes.room}>
                    <MapPin size={12} /> {e.room}
                  </span>
                )}
                <span>Occ {e.occurrence}</span>
              </div>
              {e.clash && (
                <div className={classes.clash}>
                  <TriangleAlert size={13} /> Overlaps another exam
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
