import React, { Fragment, useState, useRef, useEffect } from "react";
import classes from "./Timetable.module.css";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { saveTableImage } from "../../functions/Home/saveTableImage";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";
import { toTitleCase } from "../../functions/Common/typography";
import { formatTimeRange } from "../../functions/Common/time";
import { getCourseColorClass } from "../../functions/Common/courseColor";

const Timetable = React.forwardRef(({ selectedOccurrences, courseCodes }, ref) => {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showTutor, setShowTutor] = useState(false);
  const [showRoomAndTime, setShowRoomAndTime] = useState(true);
  const [days, setDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const allDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  const tableRef = useRef();

  const toggleShowActivity = () => {
    setShowActivity(!showActivity);
  };

  const toggleShowTutor = () => {
    setShowTutor(!showTutor);
  };

  const toggleShowRoomAndTime = () => {
    setShowRoomAndTime(!showRoomAndTime);
  };

  const toggleSettingsDropdown = () => {
    setSettingsDropdownOpen(!settingsDropdownOpen);
  };

  // the last hour shown, it moves later when a class ends after 8 PM
  const lastHour = selectedOccurrences.reduce(
    (latest, occurrence) =>
      occurrence.activities.reduce((latestInOccurrence, activity) => {
        if (!activity || activity.title === "exam") {
          return latestInOccurrence;
        }
        const [endHour, endMinute] = activity.end_time.split(":").map(Number);
        return Math.max(
          latestInOccurrence,
          endMinute > 0 ? endHour : endHour - 1
        );
      }, latest),
    20
  );

  // the labels are on the lines between the hours, so a class from 8 to 11 starts at the
  // line of 8 AM and ends at the line of 11 AM
  const formatHour = (hour) =>
    `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? "PM" : "AM"}`;

  const times = Array.from({ length: lastHour - 7 }, (_, index) =>
    formatHour(8 + index)
  );
  const endTime = formatHour(lastHour + 1);

  const activeDays = new Set();

  useEffect(() => {
    selectedOccurrences.forEach((occurrence) => {
      occurrence.activities.forEach((activity) => {
        if (activity) {
          activeDays.add(activity.day);
        }
      });
    });
    const updatedDays = allDays.filter((day) => {
      if (day === "Saturday") {
        return activeDays.has(day) || activeDays.has("Sunday");
      }
      if (day === "Sunday") {
        return activeDays.has(day) || activeDays.has("Saturday");
      }
      return true;
    });
    setDays(updatedDays);
  }, [selectedOccurrences]);


  const convertDayToRow = (day) => {
    return days.indexOf(day) + 2;
  };

  const convertTimeToColumn = (time) => {
    const [hour, minutes] = time.split(":").map(Number);
    const hourOffset = hour - 8; // Assuming timetable starts at 8 AM
    const halfHourOffset = minutes === 30 ? 1 : 0;
    return 2 + hourOffset * 2 + halfHourOffset; // Calculate grid column
  };

  const handleSaveImage = () => {
    saveTableImage(tableRef);
  };

  return (
    <div>
      <div className={classes.header}>
        <h2 className={classes.title}>Timetable</h2>
        <button onClick={handleSaveImage} className={classes.controlButton}>
          <FontAwesomeIcon icon={faCamera} className={classes.controlIcon} />
          <span>Save image</span>
        </button>
      </div>
      <div className={classes.timetableContainer} ref={tableRef}>
        <div
          className={`${classes.timetableGrid} ${days.length > 5 ? classes.weekend : ""}`}
          style={{ "--slots": times.length * 2 }}
        >
          <div className={classes.cornerCell}>
            <Dropdown
              isOpen={settingsDropdownOpen}
              toggle={() => {
                toggleSettingsDropdown();
              }}
            >
              <DropdownToggle className={classes.dropdownToggle}>
                <FontAwesomeIcon
                  icon={faGear}
                  className={classes.settingsIcon}
                />
              </DropdownToggle>
              <DropdownMenu container="body">
                <DropdownItem
                  toggle={false}
                  active={false}
                  className={classes.optionItem}
                >
                  <div className={classes.toggleOption}>
                    <p>Show Activity</p>
                    <ToggleSwitch
                      isChecked={showActivity}
                      onToggle={toggleShowActivity}
                      className={classes.optionsToggle}
                    />
                  </div>
                </DropdownItem>
                <DropdownItem
                  toggle={false}
                  active={false}
                  className={classes.optionItem}
                >
                  <div className={classes.toggleOption}>
                    <p>Show Room & Time</p>
                    <ToggleSwitch
                      isChecked={showRoomAndTime}
                      onToggle={toggleShowRoomAndTime}
                      className={classes.optionsToggle}
                    />
                  </div>
                </DropdownItem>
                <DropdownItem
                  toggle={false}
                  active={false}
                  className={classes.optionItem}
                >
                  <div className={classes.toggleOption}>
                    <p>Show Tutor</p>
                    <ToggleSwitch
                      isChecked={showTutor}
                      onToggle={toggleShowTutor}
                      className={classes.optionsToggle}
                    />
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          {times.map((time, timeIdx) => (
            <div
              key={timeIdx}
              style={{
                gridColumn: `${timeIdx * 2 + 2} / span 2`,
                gridRow: 1,
              }}
              className={classes.timetableHeader}
            >
              <span
                className={`${classes.timeLabel} ${
                  timeIdx === 0 ? classes.firstTimeLabel : ""
                }`}
              >
                {time}
              </span>
              {timeIdx === times.length - 1 && (
                <>
                  <span className={classes.endTick} />
                  <span
                    className={`${classes.timeLabel} ${classes.endTimeLabel}`}
                  >
                    {endTime}
                  </span>
                </>
              )}
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
              {[...Array(times.length * 2)].map((_, timeIdx) => (
                <div
                  key={`${dayIdx}-${timeIdx}`}
                  style={{
                    gridColumn: timeIdx + 2,
                    gridRow: dayIdx + 2,
                    borderRight:
                      timeIdx % 2 !== 0
                        ? "1px solid rgba(204, 204, 204, 0.5)"
                        : "1px solid transparent",
                    borderBottom: "1px solid rgba(204, 204, 204, 0.5)",
                  }}
                  className={classes.timeSlot}
                ></div>
              ))}
            </Fragment>
          ))}
          {selectedOccurrences.map((occurrence, idx) => (
            <Fragment key={idx}>
              {occurrence.activities.map(
                (activity, activityIdx) =>
                  activity && (activity.title !== "exam") && (
                    <div
                      key={`${idx}-${activityIdx}`}
                      style={{
                        gridRow: convertDayToRow(activity.day),
                        gridColumn: `${convertTimeToColumn(
                          activity.begin_time
                        )} / ${convertTimeToColumn(activity.end_time)}`,
                      }}
                      className={`${classes.eventCard} ${getCourseColorClass(
                        courseCodes,
                        occurrence.course_id
                      )}`}
                    >
                      <div className={classes.eventContent}>
                        {showRoomAndTime && (
                          <div className={classes.timeInfo}>
                            {formatTimeRange(
                              activity.begin_time,
                              activity.end_time
                            )}
                          </div>
                        )}
                        <div className={classes.moduleTitle}>
                          <span>{occurrence.course_id}</span>
                          {occurrence.module}
                        </div>
                        {showActivity && (
                          <div className={classes.activityTitle}>
                            <p>
                              {activity.title} · Occ {occurrence.occurence}
                            </p>
                          </div>
                        )}
                        {showRoomAndTime && (
                          <div className={classes.room}>{activity.room}</div>
                        )}
                        {showTutor && (
                          <div className={classes.tutor}>
                            {activity.tutor ? toTitleCase(activity.tutor) : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  )
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Timetable;
