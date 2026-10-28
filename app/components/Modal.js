"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import classes from "./Modal.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

/** Centered dialog on desktop, bottom sheet on phones. Traps focus and restores it on close. */
export default function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  // Always call the latest onClose without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const panel = panelRef.current;

    const onKey = (e) => {
      if (e.key === "Escape") return onCloseRef.current();
      if (e.key !== "Tab") return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={classes.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={classes.panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panelRef}>
        <header className={classes.header}>
          <h2>{title}</h2>
          <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className={classes.body}>{children}</div>
        {footer && <footer className={classes.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
