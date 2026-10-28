"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import classes from "./Toast.module.css";

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onDismiss, toast.type === "error" ? 7000 : 4000);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const Icon = toast.type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className={`${classes.toast} ${toast.type === "error" ? classes.error : ""}`} role="status">
      <Icon size={18} className={classes.icon} />
      <span>{toast.message}</span>
      <button type="button" className="icon-btn icon-btn-sm" onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
