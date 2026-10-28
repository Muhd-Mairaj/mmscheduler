"use client";

import { Check, ImageUp, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import classes from "./ModulePanel.module.css";

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 250;

const searchCourses = async (query, page, signal) => {
  const res = await fetch(
    `/api/get-courses?query=${encodeURIComponent(query)}&page=${page}&limit=${PAGE_SIZE}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

/** Results are tagged with the query they belong to, so a slow reply can never show under a newer query. */
const NO_RESULT = { query: "", items: {}, total: 0, page: 1, hasMore: false, failed: false };

export default function ModuleSearch({ query, onQueryChange, chosen, onAdd, onImport, mobile = false }) {
  const [result, setResult] = useState(NO_RESULT);
  const [loadingMore, setLoadingMore] = useState(false);
  const inputRef = useRef(null);
  const q = query.trim();

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const payload = await searchCourses(q, 1, controller.signal);
        setResult({ query: q, items: payload.results, total: payload.total, page: 1, hasMore: payload.hasMore, failed: false });
      } catch (err) {
        if (err.name !== "AbortError") setResult({ ...NO_RESULT, query: q, failed: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const current = result.query === q ? result : null;
  const loading = !!q && (!current || loadingMore);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const payload = await searchCourses(q, current.page + 1);
      setResult((prev) =>
        prev.query !== q
          ? prev
          : { ...prev, items: { ...prev.items, ...payload.results }, page: prev.page + 1, hasMore: payload.hasMore }
      );
    } catch {
      setResult((prev) => (prev.query === q ? { ...prev, failed: true } : prev));
    } finally {
      setLoadingMore(false);
    }
  };

  const entries = Object.entries(current?.items ?? {});
  const searching = q.length > 0;
  const total = current?.total ?? 0;

  return (
    <div className={classes.searchWrap}>
      <div className={classes.searchBox} data-tour="search">
        <Search size={16} className={classes.searchIcon} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={mobile ? "Search modules by code or name" : "Search modules, or paste enrollment image"}
          aria-label="Search modules"
          className={classes.searchInput}
          autoComplete="off"
        />
        {loading && <Loader2 size={16} className={classes.spin} />}
        <button
          type="button"
          className={`icon-btn icon-btn-sm ${classes.importBtn}`}
          aria-label="Import from enrollment screenshot"
          data-tour="import"
          title={mobile ? "Upload an enrollment screenshot" : "Import from an enrollment screenshot (or just paste it)"}
          onClick={onImport}
        >
          <ImageUp size={17} />
        </button>
        {searching && !loading && (
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {searching && (
        <div className={classes.results}>
          {current?.failed && <p className={classes.hint}>Couldn’t load results. Check your connection and try again.</p>}
          {current && !current.failed && entries.length === 0 && (
            <p className={classes.hint}>No modules match “{q}”.</p>
          )}
          {entries.length > 0 && (
            <p className={classes.resultCount}>
              {total} result{total === 1 ? "" : "s"}
            </p>
          )}
          <ul className={classes.resultList}>
            {entries.map(([code, occurrences]) => {
              const added = chosen.includes(code);
              const first = occurrences[0];
              return (
                <li key={code}>
                  <button
                    type="button"
                    className={classes.resultItem}
                    disabled={added}
                    onClick={() => onAdd(code, occurrences)}
                  >
                    <span className={classes.resultText}>
                      <span className={classes.code}>{code}</span>
                      <span className={classes.name}>{first?.module}</span>
                      <span className={classes.meta}>
                        {first?.credits} cr · {occurrences.length} occurrence
                        {occurrences.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className={added ? classes.added : classes.addIcon}>
                      {added ? <Check size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {current?.hasMore && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              disabled={loading}
              onClick={loadMore}
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
