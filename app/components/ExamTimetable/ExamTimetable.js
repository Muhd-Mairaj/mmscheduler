"use client";

import React, { Fragment, useRef, useState } from "react";
import classes from "./ExamTimetable.module.css";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { saveTableImage } from "../../functions/Home/saveTableImage";
import { toTitleCase } from "../../functions/Common/typography";
import { formatTimeRange } from "../../functions/Common/time";
import { getCourseColorClass } from "../../functions/Common/courseColor";

const ExamTimetable = React.forwardRef(({ selectedOccurrences, courseCodes }, ref) => {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showRoomAndTime, setShowRoomAndTime] = useState(true);

  const tableRef = useRef();

  const toggleShowActivity = () => {
    setShowActivity(!showActivity);
  };

  const toggleShowRoomAndTime = () => {
    setShowRoomAndTime(!showRoomAndTime);
  };

  const toggleSettingsDropdown = () => {
    setSettingsDropdownOpen(!settingsDropdownOpen);
  };

  // Extract only exam activities and add date information
  const examActivities = selectedOccurrences.flatMap((occurrence) =>
    occurrence.activities
      .filter((activity) => activity.title.toLowerCase() === "exam")
      .map((activity) => ({
        ...activity,
        occurrence: occurrence.occurence,
        module: occurrence.module,
        course_id: occurrence.course_id,
        date: getDateFromDay(activity.start_date),
      }))
  );

  // Helper function to convert day names to dates (for demo)
  function getDateFromDay(input) {
    const [day, month, year] = input.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Get unique dates from exam activities
  const uniqueDates = Array.from(
    new Set(examActivities.map((activity) => activity.date))
  );
  uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // the labels are on the lines between the hours, like in the timetable
  const formatHour = (hour) =>
    `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? "PM" : "AM"}`;

  const times = Array.from({ length: 12 }, (_, index) => formatHour(8 + index));
  const endTime = formatHour(20);

  const convertDateToRow = (date) => {
    return uniqueDates.indexOf(date) + 2;
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
    examActivities.length >= 1 && (
      <div>
        <div className={classes.header}>
          <h2 className={classes.title}>Exams Timetable</h2>
          <button onClick={handleSaveImage} className={classes.controlButton}>
            <FontAwesomeIcon icon={faCamera} className={classes.controlIcon} />
            <span>Save image</span>
          </button>
        </div>
        <div className={classes.timetableContainer} ref={tableRef}>
          <div className={classes.timetableGrid}>
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
            {uniqueDates.map((date, dateIdx) => (
              <Fragment key={dateIdx}>
                <div
                  style={{
                    gridColumn: 1,
                    gridRow: dateIdx + 2,
                  }}
                  className={classes.daySlot}
                >
                  {date}
                </div>
                {[...Array(24)].map((_, timeIdx) => (
                  <div
                    key={`${dateIdx}-${timeIdx}`}
                    style={{
                      gridColumn: timeIdx + 2,
                      gridRow: dateIdx + 2,
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
            {examActivities.map((activity, idx) => (
              <div
                key={idx}
                style={{
                  gridRow: convertDateToRow(activity.date),
                  gridColumn: `${convertTimeToColumn(
                    activity.begin_time
                  )} / ${convertTimeToColumn(activity.end_time)}`,
                }}
                className={`${classes.eventCard} ${getCourseColorClass(
                  courseCodes,
                  activity.course_id
                )}`}
              >
                <div className={classes.eventContent}>
                  {showRoomAndTime && (
                    <div className={classes.timeInfo}>
                      {formatTimeRange(activity.begin_time, activity.end_time)}
                    </div>
                  )}
                  <div className={classes.moduleTitle}>
                    <span>{activity.course_id}</span>
                    {activity.module}
                  </div>
                  {showActivity && (
                    <div className={classes.activityTitle}>
                      <p>
                        {activity.title} · Occ {activity.occurrence}
                      </p>
                    </div>
                  )}
                  {showRoomAndTime && (
                    <div className={classes.room}>{activity.room}</div>
                  )}
                  {activity.tutor && (
                    <div className={classes.tutor}>
                      {toTitleCase(activity.tutor)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );
});

export default ExamTimetable;
