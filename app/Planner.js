"use client";

import {
  CalendarDays,
  Camera,
  CircleHelp,
  Eraser,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  ListTodo,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DisplayMenu from "./components/DisplayMenu";
import EventDetail from "./components/EventDetail";
import ExamList from "./components/ExamList";
import ImportDialog from "./components/ImportDialog";
import ModuleList from "./components/ModuleList";
import ModuleSearch from "./components/ModuleSearch";
import WhatsNew, { tourSteps, useWelcome } from "./components/Onboarding";
import SchedulerDialog from "./components/SchedulerDialog";
import ThemeToggle from "./components/ThemeToggle";
import Timetable from "./components/Timetable";
import Toast from "./components/Toast";
import Tour from "./components/Tour";
import useImageDrop from "./hooks/useImageDrop";
import useMediaQuery from "./hooks/useMediaQuery";
import usePlanner from "./hooks/usePlanner";
import useStoredValue from "./hooks/useStoredValue";
import exportElementAsPng, { nextPaint } from "./lib/exportImage";
import { SEMESTER_LABEL } from "./seo";
import classes from "./Planner.module.css";

const DISPLAY_KEY = "mmscheduler:display";
const DEFAULT_DISPLAY = { showTime: true, showRoom: true, showTutor: false };

const parseDisplay = (raw) => {
  try {
    return { ...DEFAULT_DISPLAY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DISPLAY;
  }
};

let importCounter = 0; // gives every import attempt its own key, so its state starts fresh

export default function Planner() {
  const planner = usePlanner();
  const { status, courses, courseData, selection, colors, allowExamClash, selectedOccurrences, blocked, credits } =
    planner;

  // Phones in either orientation share one layout; landscape just drops the bottom bar.
  const isMobile = useMediaQuery("(max-width: 720px), (max-height: 520px)");
  const isShort = useMediaQuery("(max-height: 520px)"); // landscape phones

  const [tab, setTab] = useState("modules"); // phones only: modules | schedule
  const [query, setQuery] = useState("");
  const [hideBlocked, setHideBlocked] = useState(false);
  const [openModules, setOpenModules] = useState({});
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [viewPref, setViewPref] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [importJob, setImportJob] = useState(null); // { id, file } while the import dialog is open
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [displayRaw, setDisplayRaw] = useStoredValue(DISPLAY_KEY);
  const display = useMemo(() => parseDisplay(displayRaw), [displayRaw]);

  // "tour" / "news": opened automatically for new or returning visitors, or by the user.
  const [autoDialog, markSeen] = useWelcome(status !== "loading");
  const [openedDialog, setOpenedDialog] = useState(null);
  const dialog = openedDialog ?? autoDialog;

  const galleryInput = useRef(null);
  const exportStage = useRef(null);

  const view = viewPref ?? (isMobile ? "agenda" : "grid");
  const unpicked = courses.filter((c) => !selection[c]);
  const dismissToast = useCallback(() => setToast(null), []);

  const handleAdd = (code, occurrences) => {
    planner.addCourse(code, occurrences);
    setQuery("");
  };

  const handleApply = (picks, truncated) => {
    planner.applySchedule(picks);
    setToast({
      type: "success",
      message: truncated
        ? "Schedule generated (search limit reached, so it may not be the very best)."
        : "Schedule generated.",
    });
    setTab("schedule");
  };

  // ---- save image: always rendered from an off-screen, full-size grid so it stays readable ----
  useEffect(() => {
    if (!exporting) return;
    let cancelled = false;
    (async () => {
      try {
        await nextPaint(); // let the off-screen grid mount
        await exportElementAsPng(exportStage.current);
      } catch (err) {
        console.error("Timetable export failed", err);
        if (!cancelled) setToast({ type: "error", message: "Couldn’t create the image. Please try again." });
      } finally {
        if (!cancelled) setExporting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exporting]);

  // ---- import from an enrollment screenshot: paste, drop or pick ----
  const startImport = useCallback((file) => setImportJob({ id: ++importCounter, file: file ?? null }), []);
  useImageDrop(startImport);

  const handleImportApply = (items) => {
    const skipped = planner.importPlan(items);
    setTab("schedule");
    setToast({
      type: skipped.length ? "error" : "success",
      message: skipped.length
        ? `Added ${items.length} modules. ${skipped.join(", ")} clash${skipped.length === 1 ? "es" : ""} with another module, so ${skipped.length === 1 ? "its" : "their"} occurrence wasn’t selected.`
        : `Added ${items.length} module${items.length === 1 ? "" : "s"} with their occurrences.`,
    });
  };

  // ---- tour / what's new ----
  const closeDialog = () => {
    markSeen();
    setOpenedDialog(null);
  };
  const startTour = () => {
    markSeen();
    setTab("modules");
    setOpenedDialog("tour");
  };

  const handleClearAll = () => {
    if (courses.length && window.confirm("Remove all modules and start over?")) planner.clearAll();
  };

  const searching = query.trim().length > 0;

  return (
    <div className={classes.app}>
      <header className={classes.header}>
        <div className={classes.brand}>
          <span className={classes.logo}>
            <GraduationCap size={20} />
          </span>
          <div>
            <h1>MMScheduler</h1>
            <p>University of Malaya · {SEMESTER_LABEL}</p>
          </div>
        </div>
        <div className={classes.headerStats}>
          <span className={`chip ${classes.hideOnPhone}`}>{courses.length} modules</span>
          <span className="chip">{credits} credits</span>
        </div>
        <div className={classes.landscapeTabs} role="tablist" aria-label="Sections">
          <button type="button" role="tab" aria-selected={tab === "modules"} className={tab === "modules" ? classes.tabOn : ""} onClick={() => setTab("modules")}>
            <ListTodo size={15} /> Modules
          </button>
          <button type="button" role="tab" aria-selected={tab === "schedule"} className={tab === "schedule" ? classes.tabOn : ""} onClick={() => setTab("schedule")}>
            <CalendarDays size={15} /> Timetable
          </button>
        </div>
        <button type="button" className="icon-btn" data-tour="help" onClick={() => setOpenedDialog("news")} aria-label="Help and what’s new" title="Help & what’s new">
          <CircleHelp size={18} />
        </button>
        <ThemeToggle />
      </header>

      {status === "error" && (
        <div className={classes.banner} role="alert">
          <TriangleAlert size={16} /> We couldn’t restore your saved plan.
          <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      <main className={classes.main} data-tab={tab}>
        {/* ---------------- sidebar ---------------- */}
        <aside className={classes.sidebar}>
          <div className={classes.sidebarScroll}>
            <ModuleSearch
              query={query}
              onQueryChange={setQuery}
              chosen={courses}
              onAdd={handleAdd}
              mobile={isMobile}
              onImport={() => (isMobile ? galleryInput.current?.click() : startImport(null))}
            />

            {!searching && (
              <>
                <div data-tour="modules">
                {courses.length > 0 ? (
                  <>
                    <div className={classes.listHead}>
                      <h2>My modules</h2>
                      <label className={classes.inlineSwitch}>
                        <span>Hide clashing</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={hideBlocked}
                          aria-label="Hide clashing occurrences"
                          className="toggle"
                          onClick={() => setHideBlocked((v) => !v)}
                        />
                      </label>
                    </div>
                    <ModuleList
                      courses={courses}
                      courseData={courseData}
                      selection={selection}
                      colors={colors}
                      blocked={blocked}
                      hideBlocked={hideBlocked}
                      onToggleOccurrence={planner.toggleOccurrence}
                      onRemove={planner.removeCourse}
                      open={openModules}
                      onToggleOpen={(code) => setOpenModules((prev) => ({ ...prev, [code]: !prev[code] }))}
                    />
                  </>
                ) : (
                  <div className={classes.emptyState}>
                    <span className={classes.emptyIcon}>
                      <ListTodo size={26} />
                    </span>
                    <h2>Add your modules</h2>
                    <p>
                      Search by code or name above, pick an occurrence for each module, and your timetable is
                      built as you go. Clashing occurrences are disabled automatically.
                    </p>
                  </div>
                )}
                </div>

                <label className={classes.optionRow}>
                  <span>
                    <strong>Allow exam clashes</strong>
                    <span>Treat overlapping exams as compatible.</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowExamClash}
                    aria-label="Allow exam clashes"
                    className="toggle"
                    onClick={() => planner.setAllowExamClash(!allowExamClash)}
                  />
                </label>

                <p className={classes.disclaimer}>
                  Unofficial project, not affiliated with Universiti Malaya. Timetables may change — always
                  verify against official UM systems.
                </p>
              </>
            )}
          </div>

          <div className={classes.sidebarFooter}>
            <button
              type="button"
              className="btn btn-primary"
              data-tour="auto"
              style={{ flex: 1 }}
              disabled={courses.length === 0}
              onClick={() => setSchedulerOpen(true)}
            >
              <Sparkles size={16} /> Auto-schedule
            </button>
            <button
              type="button"
              className="icon-btn"
              title="Clear all modules"
              aria-label="Clear all modules"
              disabled={courses.length === 0}
              onClick={handleClearAll}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </aside>

        {/* ---------------- schedule ---------------- */}
        <section className={classes.content}>
          <div className={classes.toolbar}>
            <div className={classes.toolbarTitle}>
              <h2>Timetable</h2>
              <span className={classes.sub}>
                {selectedOccurrences.length} of {courses.length} modules placed · {credits} credits
              </span>
            </div>
            <div className={classes.toolbarActions} data-tour="toolbar">
              <div className={classes.segmented} role="radiogroup" aria-label="Timetable view">
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === "grid"}
                  className={view === "grid" ? classes.segOn : ""}
                  onClick={() => setViewPref("grid")}
                >
                  <LayoutGrid size={14} /> <span>Grid</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === "agenda"}
                  className={view === "agenda" ? classes.segOn : ""}
                  onClick={() => setViewPref("agenda")}
                >
                  <ListChecks size={14} /> <span>List</span>
                </button>
              </div>
              {view === "grid" && <DisplayMenu options={display} onChange={(next) => setDisplayRaw(JSON.stringify(next))} />}
              <button
                type="button"
                className="btn btn-sm"
                disabled={selectedOccurrences.length === 0 || exporting}
                onClick={() => setExporting(true)}
              >
                <Camera size={15} /> <span className={classes.btnLabel}>{exporting ? "Saving…" : "Save image"}</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={selectedOccurrences.length === 0}
                onClick={planner.clearSelection}
                title="Unselect every occurrence but keep your modules"
              >
                <Eraser size={15} /> <span className={classes.btnLabel}>Reset picks</span>
              </button>
            </div>
          </div>

          {unpicked.length > 0 && (
            <p className={classes.notice}>
              <TriangleAlert size={15} />
              {unpicked.length === 1 ? "1 module has" : `${unpicked.length} modules have`} no occurrence
              selected: {unpicked.join(", ")}
            </p>
          )}

          {courses.length > 0 && (
            <ul className={classes.legend}>
              {courses.map((code) => (
                <li key={code} className={`course-${colors[code] ?? 0} ${classes.legendItem}`}>
                  <span className={classes.legendDot} />
                  {code}
                  {selection[code] ? <span className={classes.legendOcc}>Occ {selection[code]}</span> : null}
                </li>
              ))}
            </ul>
          )}

          <div data-tour="timetable">
          <Timetable
            occurrences={selectedOccurrences}
            colors={colors}
            view={view}
            options={display}
            compact={isShort}
            onSelect={setSelectedEvent}
          />
          </div>

          <ExamList occurrences={selectedOccurrences} colors={colors} />
        </section>
      </main>

      {/* ---------------- phone navigation ---------------- */}
      <nav className={classes.bottomNav} aria-label="Sections">
        <button
          type="button"
          className={tab === "modules" ? classes.navOn : ""}
          aria-current={tab === "modules"}
          onClick={() => setTab("modules")}
        >
          <ListTodo size={20} />
          <span>Modules</span>
          {courses.length > 0 && <em>{courses.length}</em>}
        </button>
        <button
          type="button"
          className={tab === "schedule" ? classes.navOn : ""}
          aria-current={tab === "schedule"}
          onClick={() => setTab("schedule")}
        >
          <CalendarDays size={20} />
          <span>Timetable</span>
        </button>
      </nav>

      <SchedulerDialog
        open={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        courses={courses}
        courseData={courseData}
        selection={selection}
        allowExamClash={allowExamClash}
        onApply={handleApply}
      />
      <ImportDialog
        open={!!importJob}
        jobId={importJob?.id}
        file={importJob?.file ?? null}
        onClose={() => setImportJob(null)}
        onPickFile={startImport}
        onApply={handleImportApply}
        mobile={isMobile}
      />
      {/* phones go straight to the gallery picker, no paste step */}
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) startImport(f);
          e.target.value = "";
        }}
      />
      <EventDetail event={selectedEvent} color={selectedEvent ? colors[selectedEvent.courseId] : 0} onClose={() => setSelectedEvent(null)} />
      <WhatsNew open={dialog === "news"} onClose={closeDialog} onTour={startTour} />
      {dialog === "tour" && <Tour steps={tourSteps(isMobile)} onStep={setTab} onClose={closeDialog} />}
      <Toast toast={toast} onDismiss={dismissToast} />

      {exporting && (
        <div className={classes.exportStage} aria-hidden="true">
          <Timetable ref={exportStage} occurrences={selectedOccurrences} colors={colors} view="grid" options={display} />
        </div>
      )}
    </div>
  );
}
