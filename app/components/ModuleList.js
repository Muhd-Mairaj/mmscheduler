"use client";

import { Check, ChevronDown, Ban, Trash2 } from "lucide-react";
import { formatRange } from "../lib/time.mjs";
import { formatTutors } from "../lib/text.mjs";
import classes from "./ModulePanel.module.css";

const DAY_SHORT = (d) => String(d ?? "").slice(0, 3);

function OccurrenceRow({ occurrence, selected, blockedBy, onToggle }) {
  const disabled = !selected && blockedBy?.length > 0;
  return (
    <button
      type="button"
      className={`${classes.occ} ${selected ? classes.occSelected : ""}`}
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onToggle(occurrence)}
      title={disabled ? `Clashes with ${blockedBy.join(", ")}` : undefined}
    >
      <span className={classes.occNum}>{occurrence.occurence}</span>
      <span className={classes.occBody}>
        {occurrence.activities.map((a, i) => (
          <span key={i} className={classes.occLine}>
            <span className={classes.occWhen}>
              {a.title === "exam" ? a.start_date : DAY_SHORT(a.day)} {formatRange(a.begin_time, a.end_time)}
            </span>
            <span className={classes.occType}>{a.title}</span>
            {formatTutors(a) && <span className={classes.occTutor}>{formatTutors(a)}</span>}
          </span>
        ))}
        {disabled && (
          <span className={classes.occBlocked}>
            <Ban size={12} /> Clashes with {blockedBy.join(", ")}
          </span>
        )}
      </span>
      {selected && <Check size={16} className={classes.occCheck} />}
    </button>
  );
}

export default function ModuleList({
  courses,
  courseData,
  selection,
  colors,
  blocked,
  hideBlocked,
  onToggleOccurrence,
  onRemove,
  open,
  onToggleOpen,
}) {
  return (
    <ul className={classes.moduleList}>
      {courses.map((code) => {
        const occurrences = courseData[code] ?? [];
        const first = occurrences[0];
        const isOpen = !!open[code];
        const picked = selection[code];
        const visible = occurrences.filter(
          (o) => o.occurence === picked || !(hideBlocked && blocked.has(`${code}|${o.occurence}`))
        );
        return (
          <li key={code} className={`course-${colors[code] ?? 0} ${classes.module}`}>
            <div className={classes.moduleHead}>
              <button
                type="button"
                className={classes.moduleToggle}
                aria-expanded={isOpen}
                onClick={() => onToggleOpen(code)}
              >
                <span className={classes.swatch} />
                <span className={classes.moduleText}>
                  <span className={classes.moduleTitle}>
                    <span className={classes.code}>{code}</span>
                    <span className={classes.moduleName}>{first?.module}</span>
                  </span>
                  <span className={classes.moduleSub}>
                    {first?.credits} cr ·{" "}
                    {picked ? (
                      <strong className={classes.pickedLabel}>Occurrence {picked}</strong>
                    ) : (
                      <span className={classes.unpicked}>Not selected</span>
                    )}
                  </span>
                </span>
                <ChevronDown size={18} className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={`Remove ${code}`}
                title="Remove module"
                onClick={() => onRemove(code)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            {isOpen && (
              <div className={classes.occList}>
                {visible.map((o) => (
                  <OccurrenceRow
                    key={o.occurence}
                    occurrence={o}
                    selected={picked === o.occurence}
                    blockedBy={blocked.get(`${code}|${o.occurence}`)}
                    onToggle={onToggleOccurrence}
                  />
                ))}
                {visible.length === 0 && (
                  <p className={classes.hint}>Every occurrence clashes with your current selection.</p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
