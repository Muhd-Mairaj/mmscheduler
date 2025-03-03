import React, { Fragment, useState, useRef } from "react";
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

const Timetable = React.forwardRef(({ selectedOccurrences }, ref) => {
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showRoomAndTime, setShowRoomAndTime] = useState(false);

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
                  activity && (
                    <div
                      key={`${idx}-${activityIdx}`}
                      style={{
                        gridRow: convertDayToRow(activity.day),
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
                          #{occurrence.course_id} ({occurrence.occurence})
                          <br />
                          {occurrence.module}
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
                        {showTutor && (
                          <div className={classes.tutor}>
                            <hr />
                            {activity.tutor ? activity.tutor : ""}
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
