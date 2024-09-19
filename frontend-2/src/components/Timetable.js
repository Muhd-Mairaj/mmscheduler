import { Fragment } from "react";

function Timetable({ selectedOccurrences }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    "8:00 AM", "9:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "1:00 PM",
    "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM"
  ];

  const convertDayToColumn = (day) => {
    return days.indexOf(day) + 2;
  }

  const convertTimeToRow = (time) => {
    const [hour, minutes] = time.split(":").map(Number);
    const hourOffset = hour - 8;                    // Assuming timetable starts at 8 AM
    const halfHourOffset = minutes === 30 ? 1 : 0;
    return 2 + hourOffset * 2 + halfHourOffset + 1; // Calculate grid row
  }

  return (
    <div className="timetable-grid">
      {days.map((day, dayIdx) => (
        <div
          key={dayIdx}
          style={{
            gridColumn: dayIdx + 2,
            gridRow: `${1} / ${3}`,
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
            gridRow: `${(timeIdx + 1)*2 + 1} / ${(timeIdx + 1)*2 + 3}`,
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
                gridColumn: `${convertDayToColumn(occurrence.lecture.day)}`,
                gridRow: `${convertTimeToRow(occurrence.lecture.begin_time)} / ${convertTimeToRow(occurrence.lecture.end_time)}`,
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
                gridColumn: `${convertDayToColumn(occurrence.tutorial.day)}`,
                gridRow: `${convertTimeToRow(occurrence.tutorial.begin_time)} / ${convertTimeToRow(occurrence.tutorial.end_time)}`,
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