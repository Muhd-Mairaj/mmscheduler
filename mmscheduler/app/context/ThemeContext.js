"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => { },
  isDark: false,
  mounted: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Sync React state with the theme already set by the anti-FOUC script
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute("data-theme");
    if (domTheme === "dark" || domTheme === "light") {
      setTheme(domTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to the document whenever it changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, mounted]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const stored = localStorage.getItem("mmscheduler-theme");
      // Only auto-switch if the user hasn't manually set a preference
      if (!stored) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    // Briefly enable transitions on all elements for smooth theme switch
    document.documentElement.classList.add("theme-transition");

    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      // Only persist on explicit user toggle, so system preference listener stays active
      localStorage.setItem("mmscheduler-theme", next);
      return next;
    });

    // Remove after transition completes to avoid always-on transition overhead
    setTimeout(() => document.documentElement.classList.remove("theme-transition"), 350);
  }, []);

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
