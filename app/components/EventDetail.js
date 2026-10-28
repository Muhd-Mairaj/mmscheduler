"use client";

import { Clock, DoorOpen, Hash, UserRound } from "lucide-react";
import Modal from "./Modal";
import { DAYS, formatTime } from "../lib/time.mjs";
import classes from "./EventDetail.module.css";

/** Full details for a tapped timetable block (names get truncated in the grid). */
export default function EventDetail({ event, color, onClose }) {
  return (
    <Modal open={!!event} onClose={onClose} title={event ? event.courseId : ""}>
      {event && (
        <div className={`course-${color ?? 0} ${classes.card}`}>
          <h3 className={classes.name}>{event.name}</h3>
          <p className={classes.type}>
            {event.type} · Occurrence {event.occurrence}
          </p>
          <ul className={classes.facts}>
            <li>
              <Clock size={16} />
              <span>
                {DAYS[event.day]}, {formatTime(event.start)} – {formatTime(event.end)}
              </span>
            </li>
            {event.room && (
              <li>
                <DoorOpen size={16} />
                <span>{event.room}</span>
              </li>
            )}
            {event.tutors && (
              <li>
                <UserRound size={16} />
                <span>{event.tutors}</span>
              </li>
            )}
            <li>
              <Hash size={16} />
              <span>
                {event.courseId} · Occurrence {event.occurrence}
              </span>
            </li>
          </ul>
        </div>
      )}
    </Modal>
  );
}
