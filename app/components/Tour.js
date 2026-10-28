"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import classes from "./Tour.module.css";

const PAD = 6; // breathing room around the highlighted element
const GAP = 14; // space between highlight and card
const MARGIN = 12; // minimum distance from the screen edge
const MAX_WAIT_FRAMES = 24; // ~0.4s for a step's screen/tab to appear

const findTarget = (target) => document.querySelector(`[data-tour="${target}"]`);

/** Viewport rect of a tour target (clamped on-screen), or null if it isn't visible. */
const measure = (target) => {
  const r = findTarget(target)?.getBoundingClientRect();
  if (!r || r.width === 0 || r.height === 0) return null;
  const top = Math.max(r.top - PAD, 4);
  const left = Math.max(r.left - PAD, 4);
  const bottom = Math.min(r.bottom + PAD, window.innerHeight - 4);
  const right = Math.min(r.right + PAD, window.innerWidth - 4);
  return { top, left, width: right - left, height: Math.max(bottom - top, 24) };
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

/** Where to put the explanation card so it never covers the highlight and stays on screen. */
const placeCard = (rect, { width, height }) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect) return { top: (vh - height) / 2, left: (vw - width) / 2 };

  const centeredLeft = clamp(rect.left + rect.width / 2 - width / 2, MARGIN, vw - width - MARGIN);
  const spaceRight = vw - (rect.left + rect.width) - GAP - MARGIN;
  const spaceBelow = vh - (rect.top + rect.height) - GAP - MARGIN;
  const spaceAbove = rect.top - GAP - MARGIN;

  if (vw >= 720 && rect.width < vw * 0.6 && spaceRight >= width) {
    return {
      left: rect.left + rect.width + GAP,
      top: clamp(rect.top + rect.height / 2 - height / 2, MARGIN, vh - height - MARGIN),
    };
  }
  if (spaceBelow >= height || spaceBelow >= spaceAbove) {
    return { top: clamp(rect.top + rect.height + GAP, MARGIN, vh - height - MARGIN), left: centeredLeft };
  }
  return { top: clamp(rect.top - GAP - height, MARGIN, vh - height - MARGIN), left: centeredLeft };
};

/**
 * Spotlight tour: dims the page, highlights one real UI element at a time and
 * explains it beside it. Steps without a `target` are centred cards. A step may
 * name a `tab` to bring forward first (phones show one screen at a time).
 */
export default function Tour({ steps, onStep, onClose }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [measured, setMeasured] = useState(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);

  const step = steps[index];
  const last = index === steps.length - 1;
  const rect = step.target ? measured : null;

  const go = (delta) => {
    setDirection(delta);
    setIndex((i) => clamp(i + delta, 0, steps.length - 1));
  };

  // Bring the step's screen forward, wait for its element, then highlight it.
  useEffect(() => {
    if (step.tab) onStep?.(step.tab);
    if (!step.target) return;

    let frames = 0;
    let raf;
    const attempt = () => {
      const el = findTarget(step.target);
      if (el && measure(step.target)) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
        setMeasured(measure(step.target));
      } else if (++frames > MAX_WAIT_FRAMES) {
        // Not on screen in this layout (e.g. a button hidden on phones): skip the step.
        if (direction > 0 && last) onClose();
        else setIndex((i) => i + (direction > 0 ? 1 : -1));
      } else {
        raf = requestAnimationFrame(attempt);
      }
    };
    raf = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(raf);
    // Re-run only when the step changes; the rest is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Keep the highlight glued to its element on resize and scroll.
  useEffect(() => {
    if (!step.target) return;
    const refresh = () => {
      const next = measure(step.target);
      if (next) setMeasured(next);
    };
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [step.target]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (card) setCardPos(placeCard(rect, { width: card.offsetWidth, height: card.offsetHeight }));
  }, [rect, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") (last ? onClose() : go(1));
      else if (e.key === "ArrowLeft" && index > 0) go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className={classes.root} role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* swallows clicks so the page can't be used mid-tour */}
      <div className={classes.shield} />
      {rect ? (
        <div className={classes.spot} style={rect} />
      ) : (
        <div className={classes.dim} />
      )}

      <div ref={cardRef} className={classes.card} style={cardPos} key={index}>
        <p className={classes.count}>{step.target ? `Step ${index} of ${steps.length - 1}` : "Quick tour"}</p>
        <h3>{step.title}</h3>
        <p className={classes.text}>{step.text}</p>
        <div className={classes.actions}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {last ? "Close" : "Skip"}
          </button>
          <span className={classes.spacer} />
          {index > 0 && (
            <button type="button" className="btn btn-sm" onClick={() => go(-1)}>
              Back
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => (last ? onClose() : go(1))}>
            {last ? "Done" : index === 0 ? "Start tour" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
