export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const isExam = (activity) =>
  String(activity?.title ?? "").toLowerCase() === "exam";

/** "08:30" -> 510. Returns null for anything that isn't HH:MM. */
export const toMinutes = (time) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

/** "13:05" -> "1:05 PM" */
export const formatTime = (time) => {
  const minutes = typeof time === "number" ? time : toMinutes(time);
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** "05/01/2027" (dd/mm/yyyy) -> Date, or null. */
export const parseDate = (value) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const dayIndex = (day) =>
  DAYS.findIndex((d) => d.toLowerCase() === String(day ?? "").toLowerCase());

export const occurrenceKey = (occurrence) =>
  `${occurrence.course_id}|${occurrence.occurence}`;

/** Compact, unambiguous range: "8–10 AM", "11 AM–1 PM", "8:30–10:00 AM". */
export const formatRange = (start, end) => {
  const a = typeof start === "number" ? start : toMinutes(start);
  const b = typeof end === "number" ? end : toMinutes(end);
  if (a === null || b === null) return "";
  const clock = (m) => {
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return `${h % 12 === 0 ? 12 : h % 12}${mm ? ":" + String(mm).padStart(2, "0") : ""}`;
  };
  const half = (m) => (Math.floor(m / 60) % 24 >= 12 ? "PM" : "AM");
  return half(a) === half(b)
    ? `${clock(a)}–${clock(b)}\u00a0${half(b)}`
    : `${clock(a)}\u00a0${half(a)}–\u200b${clock(b)}\u00a0${half(b)}`; // zero-width break lets narrow bars wrap after the dash
};
