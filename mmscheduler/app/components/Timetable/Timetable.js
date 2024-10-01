import React, { Fragment } from "react";
import classes from "./Timetable.module.css";

const Timetable = React.forwardRef(({ selectedOccurrences }, ref) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
  ];

  const convertDayToColumn = (day) => {
    return days.indexOf(day) + 2;
  };

  const convertTimeToRow = (time) => {
    const [hour, minutes] = time.split(":").map(Number);
    const hourOffset = hour - 8; // Assuming timetable starts at 8 AM
    const halfHourOffset = minutes === 30 ? 1 : 0;
    return 2 + hourOffset * 2 + halfHourOffset + 1; // Calculate grid row
  };

  return (
    <div className={classes.timetableContainer} ref={ref}>
      <div className={classes.timetableGrid}>
        {days.map((day, dayIdx) => (
          <div
            key={dayIdx}
            style={{
              gridColumn: dayIdx + 2,
              gridRow: `${1} / ${3}`,
            }}
            className={classes.timetableHeader}
          >
            {day}
          </div>
        ))}
        {times.map((time, timeIdx) => (
          <Fragment key={timeIdx}>
            <div
              style={{
                gridColumn: 1,
                gridRow: `${(timeIdx + 1) * 2 + 1} / ${(timeIdx + 1) * 2 + 3}`,
              }}
              className={classes.timeSlot}
            >
              {time}
            </div>
            <div
              style={{
                gridColumn: "2 / -1",
                gridRow: `${(timeIdx + 1) * 2 + 1} / ${(timeIdx + 1) * 2 + 2}`,
              }}
              className={classes.rowLine}
            ></div>
          </Fragment>
        ))}
        {selectedOccurrences.map((occurrence, idx) => {
          return (
            <Fragment key={idx}>
              {occurrence.activities.map((activity, idx) => {
                return (
                  <>
                    {
                      activity && (
                        <div
                          key={idx + activity}
                          style={{
                            gridColumn: `${convertDayToColumn(activity.day)}`,
                            gridRow: `${convertTimeToRow(
                              activity.begin_time
                            )} / ${convertTimeToRow(activity.end_time)}`,
                          }}
                          className={(activity.title !== "tutorial") ? `${classes.lectureEvent} ${classes.eventCard}` : `${classes.tutorialEvent} ${classes.eventCard}`}
                        >
                          <div className={classes.eventContent}>
                            <div className={classes.moduleTitle}>
                              #{occurrence.course_id} ({occurrence.occurence})
                              <br />
                              {occurrence.module}
                            </div>
                            <hr />
                            <div className={classes.room}>
                              {activity.room}
                            </div>
                            <div className={classes.timeInfo}>
                              ({activity.begin_time} -{" "}
                              {activity.end_time})
                            </div>
                            <hr />
                            <div className={classes.tutor}>
                              {activity.tutor ? activity.tutor : ""}
                            </div>
                          </div>
                        </div>
                      )
                    }
                  </>)
              })}
              {/* {occurrence.lecture && (
                <div
                  key={idx + "lecture"}
                  style={{
                    gridColumn: `${convertDayToColumn(occurrence.lecture.day)}`,
                    gridRow: `${convertTimeToRow(
                      occurrence.lecture.begin_time
                    )} / ${convertTimeToRow(occurrence.lecture.end_time)}`,
                  }}
                  className={`${classes.lectureEvent} ${classes.eventCard}`}
                >
                  <div className={classes.eventContent}>
                    <div className={classes.moduleTitle}>
                      #{occurrence.course_id} ({occurrence.occurence})
                      <br />
                      {occurrence.module}
                    </div>
                    <hr />
                    <div className={classes.room}>
                      {occurrence.lecture.room}
                    </div>
                    <div className={classes.timeInfo}>
                      ({occurrence.lecture.begin_time} -{" "}
                      {occurrence.lecture.end_time})
                    </div>
                    <hr />
                    <div className={classes.tutor}>
                      {occurrence.lecture.tutor ? occurrence.lecture.tutor : ""}
                    </div>
                  </div>
                </div>
              )}
              {occurrence.tutorial && (
                <div
                  key={idx + "tutorial"}
                  style={{
                    gridColumn: `${convertDayToColumn(
                      occurrence.tutorial.day
                    )}`,
                    gridRow: `${convertTimeToRow(
                      occurrence.tutorial.begin_time
                    )} / ${convertTimeToRow(occurrence.tutorial.end_time)}`,
                  }}
                  className={`${classes.tutorialEvent} ${classes.eventCard}`}
                >
                  <div className={classes.eventContent}>
                    <div className={classes.moduleTitle}>
                      #{occurrence.course_id} ({occurrence.occurence})
                      <br />
                      {occurrence.module}
                    </div>
                    <hr />
                    <div className={classes.room}>
                      {occurrence.tutorial.room}
                    </div>
                    <div className={classes.timeInfo}>
                      ({occurrence.tutorial.begin_time} -{" "}
                      {occurrence.tutorial.end_time})
                    </div>
                    <hr />
                    <div className={classes.tutor}>
                      {occurrence.tutorial.tutor
                        ? occurrence.tutorial.tutor
                        : ""}
                    </div>
                  </div>
                </div>
              )} */}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
});

export default Timetable;