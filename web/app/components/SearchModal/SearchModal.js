import "../../globals.css";
import { useState, useEffect, useRef, useCallback } from "react";
import classes from "./SearchModal.module.css";
import Searchbar from "../Searchbar/Searchbar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ModalCard from "../SearchModalCard/SearchModalCard";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import RibbonButton from "../RibbonButton/RibbonButton";

const PAGE_SIZE = 20;
const SCROLL_THRESHOLD_PX = 200;

const SearchModal = ({
  modal,
  toggle,
  chosenCourses,
  handleSearch,
  handleModuleSelection,
  searchValue,
}) => {
  const [data, setData] = useState({});
  const [debounceValue, setDebounceValue] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  // Track latest query/page to avoid stale fetches overwriting new searches
  const activeQueryRef = useRef("");

  const filterChosen = useCallback(
    (courses) => {
      const chosenKeys = Object.keys(chosenCourses || {});
      if (chosenKeys.length === 0) return courses;
      return Object.fromEntries(
        Object.entries(courses).filter(([key]) => !chosenKeys.includes(key))
      );
    },
    [chosenCourses]
  );

  const fetchPage = useCallback(
    async (query, pageNum, { append = true } = {}) => {
      if (!query || loadingRef.current) return;
      // Don't refetch if query changed mid-flight
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/get-courses?query=${encodeURIComponent(
            query
          )}&page=${pageNum}&limit=${PAGE_SIZE}`
        );
        const payload = await res.json();

        // Support both paginated { results, total, hasMore } and legacy plain object
        const isPaginated = payload && typeof payload === "object" && "results" in payload;
        const freshResults = isPaginated ? payload.results || {} : payload || {};
        const freshTotal = isPaginated
          ? payload.total ?? Object.keys(freshResults).length
          : Object.keys(freshResults).length;
        const freshHasMore = isPaginated
          ? payload.hasMore ?? false
          : false;

        // Ignore response if user typed a newer query while fetching
        if (activeQueryRef.current !== query) return;

        const filtered = filterChosen(freshResults);
        setData((prev) => (append ? { ...prev, ...filtered } : filtered));
        setTotal(freshTotal);
        setPage(pageNum);
        setHasMore(freshHasMore);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        loadingRef.current = false;
        if (activeQueryRef.current === query) setLoading(false);
      }
    },
    [filterChosen]
  );

  // add debounce for search to prevent too many api calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceValue(searchValue);
    }, 400);

    return () => {
      clearInterval(timer);
    };
  }, [searchValue]);

  // Reset and fetch first page whenever the debounced query changes
  useEffect(() => {
    activeQueryRef.current = debounceValue;
    if (!debounceValue) {
      setData({});
      setPage(1);
      setHasMore(true);
      setTotal(0);
      setLoading(false);
      loadingRef.current = false;
      return;
    }
    setData({});
    setPage(1);
    setHasMore(true);
    setTotal(0);

    const loadFirstPage = async () => {
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/get-courses?query=${encodeURIComponent(
            debounceValue
          )}&page=1&limit=${PAGE_SIZE}`
        );
        const payload = await res.json();
        const isPaginated =
          payload && typeof payload === "object" && "results" in payload;
        const freshResults = isPaginated ? payload.results || {} : payload || {};
        const freshTotal = isPaginated
          ? payload.total ?? Object.keys(freshResults).length
          : Object.keys(freshResults).length;
        const freshHasMore = isPaginated ? payload.hasMore ?? false : false;

        if (activeQueryRef.current !== debounceValue) return;
        setData(filterChosen(freshResults));
        setTotal(freshTotal);
        setPage(1);
        setHasMore(freshHasMore);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        loadingRef.current = false;
        if (activeQueryRef.current === debounceValue) setLoading(false);
      }
    };
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceValue]);

  // Remove newly-chosen courses from the visible list without refetching
  useEffect(() => {
    setData((prev) => filterChosen(prev));
  }, [filterChosen]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || !debounceValue) return;
    fetchPage(debounceValue, page + 1, { append: true });
  }, [hasMore, debounceValue, page, fetchPage]);

  // Infinite scroll: IntersectionObserver on sentinel inside the scroll container
  useEffect(() => {
    const listEl = listRef.current;
    const sentinelEl = sentinelRef.current;
    if (!listEl || !sentinelEl) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: listEl, rootMargin: `${SCROLL_THRESHOLD_PX}px`, threshold: 0 }
    );
    observerRef.current.observe(sentinelEl);

    return () => observerRef.current?.disconnect();
  }, [loadMore, data]);

  // Fallback for browsers without IntersectionObserver firing: scroll listener
  const handleScroll = () => {
    const el = listRef.current;
    if (!el || loadingRef.current || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD_PX) {
      loadMore();
    }
  };

  const resultCount = Object.keys(data).length;
  const showList = resultCount > 0 && searchValue.length > 0;
  const showEmpty =
    !loading && resultCount === 0 && searchValue.length > 0 && debounceValue.length > 0;

  return (
    <div>
      <RibbonButton onClick={toggle} />
      <Modal isOpen={modal} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>Add modules</ModalHeader>
        <ModalBody>
          <Searchbar
            onChange={handleSearch}
            value={searchValue}
            placeholder={"Search Module"}
          />
          <br />
          {showList ? (
            <>
              {total > 0 && (
                <p className={classes.resultCount}>
                  Showing {resultCount} of {total} result{total === 1 ? "" : "s"}
                </p>
              )}
              <div
                className={classes.listItems}
                ref={listRef}
                onScroll={handleScroll}
              >
                <ul className={classes.modalList}>
                  {Object.entries(data).map(([key, value], index) => (
                    <ModalCard
                      key={key || index}
                      item={{ key, value }}
                      onClick={handleModuleSelection}
                    />
                  ))}
                </ul>
                {/* Sentinel triggers next page when scrolled into view */}
                <div ref={sentinelRef} aria-hidden="true" />
                {loading && (
                  <p className={classes.loader}>Loading more…</p>
                )}
                {!hasMore && total > PAGE_SIZE && (
                  <p className={classes.endMessage}>You&apos;ve reached the end.</p>
                )}
              </div>
            </>
          ) : showEmpty ? (
            <div className={classes.noResults}>
              <FontAwesomeIcon
                className={classes.noResultsIcon}
                icon={faSearch}
                size="2x"
              />
              <h1 className={classes.noResultsHeader}>No Results Found!</h1>
            </div>
          ) : (
            <div className={classes.noResults}>
              <FontAwesomeIcon
                className={classes.noResultsIcon}
                icon={searchValue.length === 0 ? faBook : faSearch}
                size="2x"
              />
              <h1 className={classes.noResultsHeader}>
                {searchValue.length === 0
                  ? "Find Your Courses!"
                  : loading
                    ? "Searching…"
                    : "No Results Found!"}
              </h1>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <RoundedButton
            className={`${classes.closeButton} acceptButton`}
            onClick={toggle}
          >
            Finish
          </RoundedButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SearchModal;
