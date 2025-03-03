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

const ExamTimetable = React.forwardRef(({ selectedOccurrences }, ref) => {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
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
        // For demo purposes, we'll create dates based on the day of the week
        // In a real app, you would use actual dates from your data
        date: getDateFromDay(activity.day),
      }))
  );

  // Helper function to convert day names to dates (for demo)
  function getDateFromDay(day) {
    const today = new Date();
    const dayMap = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 0,
    };

    const targetDay = dayMap[day];
    const currentDay = today.getDay();
    const daysToAdd = (targetDay + 7 - currentDay) % 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    return targetDate.toLocaleDateString("en-US", {
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

  const convertDateToRow = (date) => {
    return uniqueDates.indexOf(date) + 2;
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
    if (title === "exam") return classes.examEvent;
    return classes.otherEvent;
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
                {time}
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
                className={`${classes.eventCard} ${getEventClass(
                  activity.title
                )}`}
              >
                <div className={classes.eventContent}>
                  <div className={classes.moduleTitle}>
                    #{activity.course_id} ({activity.occurrence})
                    <br />
                    {activity.module}
                  </div>
                  {showActivity && (
                    <div className={classes.activityTitle}>
                      <hr />
                      <p>Activity: {activity.title.toUpperCase()}</p>
                    </div>
                  )}
                  {showRoomAndTime && (
                    <div className={classes.room}>
                      <hr />
                      {activity.room}
                      <div className={classes.timeInfo}>
                        ({activity.begin_time} - {activity.end_time})
                      </div>
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
