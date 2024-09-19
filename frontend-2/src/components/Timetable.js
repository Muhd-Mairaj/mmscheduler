import { Fragment } from "react";
import { sub, format } from "date-fns";

function Timetable({ selectedOccurrences }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

  const convertDayToColumn = (day) => {
    switch (day) {
      case "Monday":
        return 1;
      case "Tuesday":
        return 2;
      case "Wednesday":
        return 3;
      case "Thursday":
        return 4;
      case "Friday":
        return 5;
      default:
        return 1;
    }
  }

  const convertTimeToRow = (time) => {
    const temp = sub(new Date(`2024-09-18T${time}`), { hours: 8 })
    return parseInt(format(temp, "H"), 10);
  }

    return (
      <div className="timetable-grid">
        {days.map((day, dayIdx) => (
          <div
            key={dayIdx}
            style={{
              gridColumn: dayIdx + 2,
              gridRow: 1,
            }}
            className="timetable-header"
          >
            {day}
          </div>
        ))}
        {times.map((time, timeIdx) => (
          <div
            key={timeIdx}
            style={{
              gridColumn: 1,
              gridRow: timeIdx + 2,
            }}
            className="time-slot"
          >
            {time}
          </div>
        ))}
        {selectedOccurrences.map((occurrence, idx) => {
          return <Fragment key={idx}>
            {occurrence.lecture && (
              <div
                key={idx + "lecture"}
                style={{
                  gridColumn: `${convertDayToColumn(occurrence.lecture.day) + 1}`,
                  gridRow: `${convertTimeToRow(occurrence.lecture.begin_time) + 2} / ${convertTimeToRow(occurrence.lecture.end_time) + 2}`,
                }}
                className="lecture-event"
              >
                {occurrence.module} ({occurrence.lecture.begin_time} - {occurrence.lecture.end_time})
              </div>
            )}
            {occurrence.tutorial && (
              <div
                key={idx + "tutorial"}
                style={{
                  gridColumn: `${convertDayToColumn(occurrence.tutorial.day) + 1}`,
                  gridRow: `${convertTimeToRow(occurrence.tutorial.begin_time) + 2} / ${convertTimeToRow(occurrence.tutorial.end_time) + 2}`,
                }}
                className="tutorial-event"
              >
                {occurrence.module} ({occurrence.tutorial.begin_time} - {occurrence.tutorial.end_time})
              </div>
            )}
          </Fragment>
        })}
      </div>
    );
  }

  export default Timetable;