"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "mmscheduler-theme";
const root = () => document.documentElement;

// The <html data-theme> attribute is the single source of truth (the inline
// script in layout.tsx sets it before first paint), so React just observes it.
const subscribe = (callback) => {
  const observer = new MutationObserver(callback);
  observer.observe(root(), { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const getTheme = () => (root().getAttribute("data-theme") === "dark" ? "dark" : "light");

/** Keeps the phone's status bar / notch colour in step with the app theme. */
const applyTheme = (theme) => {
  root().setAttribute("data-theme", theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = theme === "dark" ? "#161616" : "#ffffff";
  document.head.appendChild(meta);
};

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  // Follow the OS setting until the user makes an explicit choice.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        /* ignore */
      }
      applyTheme(e.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = getTheme() === "dark" ? "light" : "dark";
    root().classList.add("theme-transition");
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    setTimeout(() => root().classList.remove("theme-transition"), 350);
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
