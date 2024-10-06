import React, { Fragment } from "react";
import classes from "./Timetable.module.css";

const Timetable = React.forwardRef(({ selectedOccurrences }, ref) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
    "6:00 PM", "7:00 PM",
  ];

  const convertDayToRow = (day) => {
    return days.indexOf(day) + 2;
  };

  const convertTimeToColumn = (time) => {
    const [hour, minutes] = time.split(":").map(Number);
    const hourOffset = hour - 8; // Assuming timetable starts at 8 AM
    const halfHourOffset = minutes === 30 ? 1 : 0;
    return 2 + hourOffset * 2 + halfHourOffset; // Calculate grid column
  };

  const getEventClass = (title) => {
    title = title.toLowerCase();
    if (title === "lecture") return classes.lectureEvent;
    if (title === "tutorial") return classes.tutorialEvent;
    if (title === "lab") return classes.labEvent;
    if (title === "online") return classes.onlineEvent;
    return classes.otherEvent;
  }

  return (
    <div className={classes.timetableContainer} ref={ref}>
      <div className={classes.timetableGrid}>
        <div className={classes.cornerCell}></div>
        {times.map((time, timeIdx) => (
          <div
            key={timeIdx}
            style={{
              gridColumn: `${timeIdx * 2 + 2} / span 2`,
              gridRow: 1,
            }}
            className={classes.timetableHeader}
          >
            {time}
          </div>
        ))}
        {days.map((day, dayIdx) => (
          <Fragment key={dayIdx}>
            <div
              style={{
                gridColumn: 1,
                gridRow: dayIdx + 2,
              }}
              className={classes.daySlot}
            >
              {day}
            </div>
            {[...Array(24)].map((_, timeIdx) => (
              <div
                key={`${dayIdx}-${timeIdx}`}
                style={{
                  gridColumn: timeIdx + 2,
                  gridRow: dayIdx + 2,
                }}
                className={classes.timeSlot}
              ></div>
            ))}
          </Fragment>
        ))}
        {selectedOccurrences.map((occurrence, idx) => (
          <Fragment key={idx}>
            {occurrence.activities.map((activity, activityIdx) => (
              activity && (
                <div
                  key={`${idx}-${activityIdx}`}
                  style={{
                    gridRow: convertDayToRow(activity.day),
                    gridColumn: `${convertTimeToColumn(activity.begin_time)} / ${convertTimeToColumn(activity.end_time)}`,
                  }}
                  className={`${classes.eventCard} ${getEventClass(activity.title)}`}
                >
                  <div className={classes.eventContent}>
                    <div className={classes.moduleTitle}>
                      #{occurrence.course_id} ({occurrence.occurence})
                      <br />
                      {occurrence.module}
                    </div>
                    <hr />
                    <div className={classes.activityTitle}>
                      <p>Activity: {activity.title}</p>
                    </div>
                    <hr />
                    <div className={classes.room}>
                      {activity.room}
                    </div>
                    <div className={classes.timeInfo}>
                      ({activity.begin_time} - {activity.end_time})
                    </div>
                    <hr />
                    <div className={classes.tutor}>
                      {activity.tutor ? activity.tutor : ""}
                    </div>
                  </div>
                </div>
              )
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
});

export default Timetable;