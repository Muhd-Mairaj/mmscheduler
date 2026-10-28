"use client";

import { SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import classes from "./DisplayMenu.module.css";

export default function DisplayMenu({ options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows = [
    ["showTime", "Show time"],
    ["showRoom", "Show room"],
    ["showTutor", "Show lecturer"],
  ];

  return (
    <div className={classes.wrap} ref={ref}>
      <button
        type="button"
        className="btn btn-sm"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={15} /> <span className={classes.label}>Display</span>
      </button>
      {open && (
        <div className={classes.menu} role="group" aria-label="Display options">
          {rows.map(([key, text]) => (
            <label key={key} className={classes.row}>
              <span>{text}</span>
              <button
                type="button"
                role="switch"
                aria-checked={options[key]}
                aria-label={text}
                className="toggle"
                onClick={() => onChange({ ...options, [key]: !options[key] })}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
