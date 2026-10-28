"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set();
// Used when localStorage is unavailable (private mode, blocked storage) so state still works in-session.
const memory = new Map();

const subscribe = (callback) => {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
};

const read = (key) => {
  if (memory.has(key)) return memory.get(key);
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * A string in localStorage as React state, safe for SSR: the server (and the
 * first client render) see `serverValue`, then the real stored value.
 */
export default function useStoredValue(key, serverValue = null) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => serverValue
  );

  const set = useCallback(
    (next) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next);
      } catch {
        /* kept in memory only */
      }
      listeners.forEach((notify) => notify());
    },
    [key]
  );

  return [value, set];
}
