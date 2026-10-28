"use client";

import { forwardRef, useMemo } from "react";
import { DAYS, dayIndex, formatRange, formatTime, isExam, toMinutes } from "../lib/time.mjs";
import { formatTutors } from "../lib/text.mjs";
import classes from "./Timetable.module.css";

const LANE_PX = 88; // height of one stacked event
const LANE_PX_COMPACT = 62;
const MIN_START_HOUR = 8;
const MIN_END_HOUR = 17;

/** Flatten selected occurrences into drawable, non-exam events. */
const toEvents = (occurrences) => {
  const events = [];
  for (const occ of occurrences) {
    occ.activities.forEach((a, i) => {
      if (isExam(a)) return;
      const day = dayIndex(a.day);
      const start = toMinutes(a.begin_time);
      const end = toMinutes(a.end_time);
      if (day < 0 || start === null || end === null || end <= start) return;
      events.push({
        id: `${occ.course_id}|${occ.occurence}|${i}`,
        courseId: occ.course_id,
        name: occ.module,
        occurrence: occ.occurence,
        type: a.title,
        room: a.room,
        tutors: formatTutors(a),
        day,
        start,
        end,
      });
    });
  }
  return events;
};

/** Side-by-side lanes for events that overlap in time on the same day. */
const layoutDay = (events) => {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const placed = [];
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = [];
    for (const ev of cluster) {
      let lane = lanes.findIndex((end) => end <= ev.start);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = ev.end;
      ev.lane = lane;
    }
    cluster.forEach((ev) => placed.push({ ...ev, lanes: lanes.length }));
    cluster = [];
  };

  for (const ev of sorted) {
    if (cluster.length && ev.start >= clusterEnd) flush();
    cluster.push({ ...ev });
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  if (cluster.length) flush();
  return placed;
};

const Timetable = forwardRef(function Timetable(
  { occurrences, colors, view, options, compact = false, onSelect },
  ref
) {
  const lanePx = compact ? LANE_PX_COMPACT : LANE_PX;
  const events = useMemo(() => toEvents(occurrences), [occurrences]);

  const days = useMemo(() => {
    const used = new Set(events.map((e) => e.day));
    const weekend = used.has(5) || used.has(6);
    return DAYS.map((name, index) => ({ name, index })).filter((d) => d.index < 5 || weekend);
  }, [events]);

  const { startHour, endHour } = useMemo(() => {
    let min = MIN_START_HOUR * 60;
    let max = MIN_END_HOUR * 60;
    for (const e of events) {
      min = Math.min(min, e.start);
      max = Math.max(max, e.end);
    }
    return { startHour: Math.floor(min / 60), endHour: Math.ceil(max / 60) };
  }, [events]);

  const span = (endHour - startHour) * 60;
  const hourCount = endHour - startHour;
  const rows = useMemo(
    () =>
      days.map((day) => {
        const placed = layoutDay(events.filter((e) => e.day === day.index));
        return { day, placed, lanes: Math.max(1, ...placed.map((e) => e.lanes)) };
      }),
    [days, events]
  );

  if (view === "agenda") {
    return (
      <div ref={ref} className={classes.agenda}>
        {events.length === 0 && <p className={classes.empty}>Pick occurrences to see your week here.</p>}
        {days.map((day) => {
          const dayEvents = events.filter((e) => e.day === day.index).sort((a, b) => a.start - b.start);
          if (dayEvents.length === 0) return null;
          return (
            <section key={day.name} className={classes.agendaDay}>
              <h3>{day.name}</h3>
              {dayEvents.map((e) => (
                <div key={e.id} className={`course-${colors[e.courseId] ?? 0} ${classes.agendaItem}`}>
                  <div className={classes.agendaTime}>
                    <strong>{formatTime(e.start)}</strong>
                    <span>{formatTime(e.end)}</span>
                  </div>
                  <div className={classes.agendaBody}>
                    <div className={classes.agendaTitle}>
                      <span className={classes.eventCode}>{e.courseId}</span> {e.name}
                    </div>
                    <div className={classes.agendaMeta}>
                      <span className={classes.typeTag}>{e.type}</span>
                      <span>Occ {e.occurrence}</span>
                      {e.room && <span>{e.room}</span>}
                      {e.tutors && <span>{e.tutors}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    );
  }

  const hours = Array.from({ length: hourCount + 1 }, (_, i) => startHour + i);

  return (
    <div className={classes.scroller}>
      <div ref={ref} className={classes.grid} style={{ "--hours": hourCount }}>
        {/* time axis: each label sits exactly on its hour line */}
        <div className={classes.row}>
          <div className={`${classes.dayCell} ${classes.axisCorner}`} />
          <div className={classes.axis}>
            {hours.map((h, i) => (
              <span
                key={h}
                className={`${classes.tick} ${i === 0 ? classes.tickFirst : ""} ${i === hourCount ? classes.tickLast : ""}`}
                style={{ left: `${(i / hourCount) * 100}%` }}
              >
                {formatTime(h * 60).replace(":00", "")}
              </span>
            ))}
          </div>
        </div>

        {rows.map(({ day, placed, lanes }) => (
          <div key={day.name} className={classes.row}>
            <div className={classes.dayCell}>
              <span className={classes.dayLong}>{day.name}</span>
              <span className={classes.dayShort}>{day.name.slice(0, 3)}</span>
            </div>
            <div className={classes.track} style={{ height: lanes * lanePx + 10 }}>
              {placed.map((e) => {
                const left = ((e.start - startHour * 60) / span) * 100;
                const width = ((e.end - e.start) / span) * 100;
                const roomy = !compact && e.end - e.start >= 90; // enough width for the extra detail lines
                return (
                  <div
                    key={e.id}
                    {...(onSelect && {
                      role: "button",
                      tabIndex: 0,
                      onClick: () => onSelect(e),
                      onKeyDown: (ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), onSelect(e)),
                    })}
                    className={`course-${colors[e.courseId] ?? 0} ${classes.event} ${roomy ? "" : classes.eventNarrow} ${compact ? classes.eventCompact : ""}`}
                    style={{
                      left: `calc(${left}% + 1px)`,
                      width: `calc(${width}% - 2px)`,
                      top: 5 + e.lane * lanePx,
                      height: lanePx - 4,
                    }}
                    title={`${e.courseId} ${e.name}\n${e.type} · Occ ${e.occurrence}\n${formatTime(e.start)} – ${formatTime(e.end)}${e.room ? `\n${e.room}` : ""}${e.tutors ? `\n${e.tutors}` : ""}`}
                  >
                    {options.showTime && <span className={classes.eventTime}>{formatRange(e.start, e.end)}</span>}
                    <span className={classes.eventCode}>{e.courseId}</span>
                    <span className={classes.eventName}>{e.name}</span>
                    {roomy && (
                      <span className={classes.eventMeta}>
                        <span className={classes.typeTag}>{e.type}</span> · Occ {e.occurrence}
                      </span>
                    )}
                    {roomy && options.showRoom && e.room && (
                      <span className={classes.eventMeta}>{e.room}</span>
                    )}
                    {roomy && options.showTutor && e.tutors && (
                      <span className={classes.eventMeta}>{e.tutors}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className={classes.gridEmpty}>
            Select an occurrence for each module and your week will appear here.
          </div>
        )}
      </div>
      <p className={classes.swipeHint}>Swipe sideways to see the whole day →</p>
    </div>
  );
});

export default Timetable;
