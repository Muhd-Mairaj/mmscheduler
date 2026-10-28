"use client";

import useStoredValue from "../hooks/useStoredValue";
import Modal from "./Modal";
import classes from "./Onboarding.module.css";

// Bump when there is something new worth telling returning visitors about.
export const WHATS_NEW_VERSION = "2026.10.29";
const SEEN_KEY = "mmscheduler:seen";

/**
 * What to show automatically: "tour" for a brand-new visitor, "news" when they
 * last saw an older version, null otherwise (or until `ready`). `markSeen`
 * records the current version so it doesn't show again.
 */
export function useWelcome(ready) {
  // The server render pretends the visitor has seen it, so nothing flashes.
  const [seen, setSeen] = useStoredValue(SEEN_KEY, WHATS_NEW_VERSION);
  const mode = !ready || seen === WHATS_NEW_VERSION ? null : seen ? "news" : "tour";
  return [mode, () => setSeen(WHATS_NEW_VERSION)];
}

export const tourSteps = (mobile) => [
  {
    title: "Welcome to MMScheduler",
    text: "Plan your UM timetable in a minute: add your modules, pick occurrences, and let clashes sort themselves out. Here’s a quick tour of the screen.",
  },
  {
    target: "search",
    tab: "modules",
    title: "Add your modules",
    text: "Search by module code or name, then tap a result to add it. Your plan is saved in this browser.",
  },
  {
    target: "import",
    tab: "modules",
    title: mobile ? "Upload your enrollment" : "Paste your enrollment",
    text: mobile
      ? "Tap here and choose a screenshot of your Registered Modules table from your gallery. Every module is added with the right occurrence."
      : "Screenshot your Registered Modules table and paste it anywhere on the page (Ctrl/⌘ + V), or click here to choose a file. Every module is added with the right occurrence.",
  },
  {
    target: "modules",
    tab: "modules",
    title: "Pick your occurrences",
    text: "Open a module and tap an occurrence to place it. Ones that clash with your timetable are greyed out and say what they clash with.",
  },
  {
    target: "auto",
    tab: "modules",
    title: "Let Auto-schedule choose",
    text: "Tell it your days off, preferred lecturers and hours, and it finds the best clash-free combination.",
  },
  {
    target: "timetable",
    tab: "schedule",
    title: "Your week at a glance",
    text: "Each class shows its own time, like “8–10 AM”. Tap a block for the full details.",
  },
  {
    target: "toolbar",
    tab: "schedule",
    title: "Switch views and save",
    text: "Flip between Grid and List, choose what the blocks show, and save your timetable as an image.",
  },
  {
    target: "help",
    title: "Need this again?",
    text: "Tap the ? any time to see what’s new or replay this tour.",
  },
];

const NEW = [
  ["Guided tour", "A spotlight walkthrough of the app for new users. Replay it any time."],
  ["Paste or upload your enrollment", "Import all your modules and occurrences from a screenshot of your Registered Modules table."],
  ["A clearer timetable", "Days down the side, hours across the top, and every class prints its own time, like “8–10 AM”."],
  ["Made for phones", "List view by default, a landscape mode that uses the whole screen, and tap-for-details on blocks."],
  ["No more duplicate sessions", "Classes taught by several lecturers now show once, with all lecturers listed."],
  ["Save image that works", "Downloads on desktop and opens the share sheet on phones."],
  ["Smarter Auto-schedule", "Choose days off, earliest start, latest finish and fewer campus days."],
];

export default function WhatsNew({ open, onClose, onTour }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What’s new"
      footer={
        <>
          <button type="button" className="btn" onClick={onTour}>
            Take the tour
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </>
      }
    >
      <ul className={classes.news}>
        {NEW.map(([title, text]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
