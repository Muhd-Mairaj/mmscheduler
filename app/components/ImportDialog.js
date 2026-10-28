"use client";

import { AlertTriangle, CheckCircle2, ImageUp, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { importFromImage } from "../lib/ocr";
import classes from "./ImportDialog.module.css";

const NOTHING_FOUND =
  "I couldn’t find any module codes in that image. Try a sharper, full-width screenshot of the Registered Modules table.";

/**
 * One import attempt. The parent re-keys this component for every new image,
 * so all state below starts fresh and nothing needs resetting.
 */
function ImportFlow({ file, onClose, onPickFile, onApply, mobile }) {
  const [phase, setPhase] = useState(file ? "reading" : "idle"); // idle | reading | review | error
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState([]);
  const [included, setIncluded] = useState({});
  const [error, setError] = useState("");
  const input = useRef(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    importFromImage(file, (p) => !cancelled && setProgress(p))
      .then(({ items: found }) => {
        if (cancelled) return;
        setItems(found);
        setIncluded(Object.fromEntries(found.filter((i) => i.state !== "unknown").map((i) => [i.code, true])));
        setError(found.length ? "" : NOTHING_FOUND);
        setPhase(found.length ? "review" : "error");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`Couldn’t read the image (${err.message}).`);
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const setOccurrence = (code, occurrence) =>
    setItems((prev) =>
      prev.map((i) => (i.code === code ? { ...i, occurrence, state: occurrence ? "ok" : "occurrence-missing" } : i))
    );

  const matched = items.filter((i) => i.state !== "unknown");
  const unknown = items.filter((i) => i.state === "unknown");
  const usable = matched.filter((i) => included[i.code]);

  const apply = () => {
    onApply(usable);
    onClose();
  };

  const picker = (
    <button type="button" className="btn" onClick={() => input.current?.click()}>
      <ImageUp size={16} /> {mobile ? "Choose another from gallery" : "Choose another image"}
    </button>
  );

  let footer = null;
  if (phase === "review") {
    footer = (
      <>
        {picker}
        <button type="button" className="btn btn-primary" disabled={usable.length === 0} onClick={apply}>
          Add {usable.length} module{usable.length === 1 ? "" : "s"}
        </button>
      </>
    );
  } else if (phase === "error" || (phase === "idle" && !mobile)) {
    footer = picker;
  }

  return (
    <Modal open onClose={onClose} title="Import from enrollment screenshot" footer={footer}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPickFile(picked);
          e.target.value = "";
        }}
      />

      {phase === "idle" && (
        <div className={classes.center}>
          <ImageUp size={34} />
          {mobile ? (
            <>
              <h3>Upload your enrollment screenshot</h3>
              <p>Choose a screenshot of your “Registered Modules” table from your gallery.</p>
              <button type="button" className="btn btn-primary" onClick={() => input.current?.click()}>
                <ImageUp size={16} /> Choose from gallery
              </button>
            </>
          ) : (
            <>
              <h3>Paste your enrollment screenshot</h3>
              <p>
                Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>V</kbd> anywhere on this page, drop an image here, or choose a
                file. The “Registered Modules” table from the UM portal works best.
              </p>
            </>
          )}
        </div>
      )}

      {phase === "reading" && (
        <div className={classes.center} role="status">
          <Loader2 size={32} className={classes.spin} />
          <h3>Reading your screenshot…</h3>
          <div className={classes.bar} aria-hidden>
            <span style={{ width: `${Math.max(6, progress * 100)}%` }} />
          </div>
          <p>This happens on your device. The image is never uploaded.</p>
        </div>
      )}

      {phase === "error" && (
        <div className={classes.center} role="alert">
          <XCircle size={32} className={classes.bad} />
          <h3>Nothing to import</h3>
          <p>{error}</p>
        </div>
      )}

      {phase === "review" && (
        <>
          <p className={classes.lead}>
            Found {matched.length} module{matched.length === 1 ? "" : "s"}. Check them, then add them to your timetable.
          </p>
          <ul className={classes.list}>
            {matched.map((item) => (
              <li key={item.code} className={classes.item}>
                <label className={classes.check}>
                  <input
                    type="checkbox"
                    checked={!!included[item.code]}
                    onChange={(e) => setIncluded((p) => ({ ...p, [item.code]: e.target.checked }))}
                  />
                  <span className={classes.text}>
                    <span className={classes.code}>{item.code}</span>
                    <span className={classes.name}>{item.name}</span>
                  </span>
                </label>
                {item.state === "ok" ? (
                  <span className={classes.ok}>
                    <CheckCircle2 size={15} /> Occurrence {item.occurrence}
                  </span>
                ) : (
                  <span className={classes.warn}>
                    <AlertTriangle size={15} />
                    <select
                      aria-label={`Occurrence for ${item.code}`}
                      value={item.occurrence ?? ""}
                      onChange={(e) => setOccurrence(item.code, e.target.value || null)}
                    >
                      <option value="">Pick occurrence…</option>
                      {item.occurrences.map((o) => (
                        <option key={o.occurence} value={o.occurence}>
                          Occurrence {o.occurence}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {unknown.length > 0 && (
            <p className={classes.unknown}>
              Couldn’t match: {unknown.map((u) => u.code).join(", ")}. You can add {unknown.length === 1 ? "it" : "them"}{" "}
              with the search box.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

export default function ImportDialog({ open, jobId, ...props }) {
  return open ? <ImportFlow key={jobId} {...props} /> : null;
}
