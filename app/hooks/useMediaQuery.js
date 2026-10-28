"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query hook (renders `false` on the server). */
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
