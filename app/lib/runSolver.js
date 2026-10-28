import { solve } from "./solver.mjs";

/**
 * Runs the solver in a Web Worker so the UI never freezes; falls back to the
 * main thread if workers are unavailable. Returns { promise, cancel }.
 */
export default function runSolver(payload) {
  let worker = null;
  let settled = false;

  const promise = new Promise((resolve, reject) => {
    const fallback = () => {
      try {
        resolve(solve(payload.courses, payload.prefs, payload.allowExamClash, payload.locked));
      } catch (err) {
        reject(err);
      }
    };

    try {
      worker = new Worker(new URL("./solver.worker.mjs", import.meta.url), { type: "module" });
    } catch {
      fallback();
      return;
    }
    worker.onmessage = (event) => {
      settled = true;
      worker.terminate();
      event.data.ok ? resolve(event.data.result) : reject(new Error(event.data.error));
    };
    worker.onerror = () => {
      worker.terminate();
      settled = true;
      fallback();
    };
    worker.postMessage(payload);
  });

  return {
    promise,
    cancel: () => {
      if (!settled) worker?.terminate();
    },
  };
}
