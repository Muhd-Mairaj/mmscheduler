"use client";

import classes from "./page.module.css";
import { useEffect, useState, useRef, useCallback } from "react";
import Timetable from "./components/Timetable/Timetable";
import OccurrenceCard from "./components/OccurrenceCard/OccurrenceCard";
import SearchModal from "./components/SearchModal/SearchModal";
import AnnouncementModal from "./components/AnnouncementModal/AnnouncementModal";
import {
  faTimes,
  faCalendarDays,
  faChevronDown,
  faCamera,
  faRotateLeft,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import isClashing from "./functions/Home/isClashing";
import Navbar from "./components/Navbar/Navbar";
import saveTableImage from "./functions/Home/saveTableImage";
import Footer from "./components/Footer/Footer";
import Searchbar from "./components/Searchbar/Searchbar";
import { getCourseColorClass } from "./functions/Common/courseColor";
import AlertText from "./components/AlertText/AlertText";
import AIModal from "./components/AIModal/AIModal";
import ExamTimetable from "./components/ExamTimetable/ExamTimetable";
import ToggleSwitch from "./components/ToggleSwitch/ToggleSwitch";
import ImportModal from "./components/ImportModal/ImportModal";

// Only the saved plan is cleared, the rest of local storage (like the theme) stays
const SAVED_KEYS = [
  "courses",
  "selectedOccurences",
  "disabledOccurences",
  "isAllowExamClash",
];
const clearSavedState = () =>
  SAVED_KEYS.forEach((key) => localStorage.removeItem(key));

const Home = () => {
  const [chosenCourses, setChosenCourses] = useState({});
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] =
    useState(true);
  const [AIModalVisible, setAIModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [alertText, setAlertText] = useState("");
  const [expandedCourses, setExpandedCourses] = useState({});
  const [moduleFilter, setModuleFilter] = useState("");
  const [isAllowExamClash, setIsAllowExamClash] = useState(false);

  const toggleSearchModal = () => setSearchModalVisible(!searchModalVisible);
  const toggleAIModal = () => setAIModalVisible(!AIModalVisible);
  const toggleImportModal = () => setImportModalVisible(!importModalVisible);
  const toggleAnnouncementModal = () =>
    setAnnouncementModalVisible(!announcementModalVisible);

  const handleSearch = (currentSearchValue) => {
    setSearchValue(currentSearchValue);
  };

  const handleErrorMessage = (message) => {
    setAlertText(message);
  };

  const handleUpdateChosenCourses = (newSelectedOccurrences) => {
    // Update all selected occurrences at once
    setSelectedOccurences(newSelectedOccurrences);
  };

  const handleResetTable = () => {
    setSelectedOccurences([]);
    setDisabledOccurences([]);
    clearSavedState();
  };

  const handleResetModules = () => {
    setChosenCourses({});
    setModuleFilter("");
    setSelectedOccurences([]);
    setDisabledOccurences([]);
    clearSavedState();
  };

  const handleAddModule = (key, value) => {
    const updatedCourses = {
      ...chosenCourses,
      [key]: value,
    };
    setChosenCourses(updatedCourses);
  };

  const handleRemoveModule = (courseCode) => {
    const updatedCourses = { ...chosenCourses };
    delete updatedCourses[courseCode];
    const updatedSelectedOccurences = selectedOccurences.filter(
      (occurence) => occurence.course_id !== courseCode
    );
    setChosenCourses(updatedCourses);
    setSelectedOccurences(updatedSelectedOccurences);

    if (Object.keys(updatedCourses).length === 0) {
      setModuleFilter("");
    }
  };

  const handleImportImage = (file) => {
    // close the search modal so only one modal is open at a time
    setSearchModalVisible(false);
    setImportFile(file);
    setImportModalVisible(true);
  };

  const handleImportModules = (modules) => {
    const updatedCourses = { ...chosenCourses };
    let updatedSelectedOccurences = [...selectedOccurences];
    const clashingCodes = [];

    modules.forEach(({ code, occurrences, occurrence }) => {
      updatedCourses[code] = occurrences;

      if (!occurrence) {
        return;
      }

      // replace the occurrence that was selected before for the same module
      const otherOccurences = updatedSelectedOccurences.filter(
        (item) => item.course_id !== code
      );
      const isClashingWithOthers = otherOccurences.some((item) =>
        isClashing(item, occurrence, isAllowExamClash)
      );

      if (isClashingWithOthers) {
        clashingCodes.push(code);
        return;
      }
      updatedSelectedOccurences = [...otherOccurences, occurrence];
    });

    setChosenCourses(updatedCourses);
    setSelectedOccurences(updatedSelectedOccurences);

    if (clashingCodes.length > 0) {
      handleErrorMessage(
        `${clashingCodes.join(", ")} clash with other modules, select ${
          clashingCodes.length === 1 ? "its occurrence" : "their occurrences"
        } manually`
      );
    }
  };

  const handleOccurenceSelect = (selectedOccurence, isDisabled) => {
    if (isDisabled) {
      return;
    }

    let updatedSelectedOccurences = [];

    const isSameOccurence = selectedOccurences.some((occurence) =>
      isSame(occurence, selectedOccurence)
    );
    const isSameCourse = selectedOccurences.some(
      (occurence) => occurence.course_id === selectedOccurence.course_id
    );

    // Note: same occurence means the same course and occurence
    // This must be checked before checking if only course is same
    if (isSameOccurence) {
      // unselect the occurence
      updatedSelectedOccurences = selectedOccurences.filter(
        (occurence) => !isSame(occurence, selectedOccurence)
      );
    } else if (isSameCourse) {
      // swap the occurence
      updatedSelectedOccurences = selectedOccurences.map((occurence) => {
        if (occurence.course_id === selectedOccurence.course_id) {
          return selectedOccurence;
        }
        return occurence;
      });
    } else {
      // add the occurence
      updatedSelectedOccurences = [...selectedOccurences, selectedOccurence];
    }

    setSelectedOccurences(updatedSelectedOccurences);
  };

  useEffect(() => {
    for (let i = 0; i < disabledOccurences.length; i++) {
      const disabledOccurence = disabledOccurences[i];
      // if (selectedOccurences.includes(disabledOccurence)) {
      //   const updatedSelectedOccurences = selectedOccurences.filter((occurence) => !isSame(occurence, disabledOccurence));
      //   setSelectedOccurences(updatedSelectedOccurences);
      // }
      for (let j = 0; j < selectedOccurences.length; j++) {
        const selectedOccurence = selectedOccurences[j];
        if (isSame(disabledOccurence, selectedOccurence)) {
          const updatedSelectedOccurences = selectedOccurences.filter(
            (occurence) => !isSame(occurence, disabledOccurence)
          );
          setSelectedOccurences(updatedSelectedOccurences);
        }
      }
    }
  }, [disabledOccurences]);

  const handleSaveState = useCallback(
    (chosenCourses, selectedOccurences, disabledOccurences, isAllowExamClash) => {
      localStorage.setItem("courses", JSON.stringify(chosenCourses));
      localStorage.setItem(
        "selectedOccurences",
        JSON.stringify(selectedOccurences)
      );
      localStorage.setItem(
        "disabledOccurences",
        JSON.stringify(disabledOccurences)
      );
      localStorage.setItem("isAllowExamClash", JSON.stringify(isAllowExamClash));
    },
    []
  );

  useEffect(() => {
    const fetchData = async (courses, selected, disabled) => {
      const tempCourses = await fetch(
        "/api/get-courses-by-ids?query=" + Object.keys(courses).join(",")
      )
        .then((res) => res.json())
        .then((data) => data);

      const tempSelected = [];
      selected.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id];
        // the module may not exist anymore after the timetable data was updated
        if (!course) {
          return;
        }
        for (let i = 0; i < course.length; i++) {
          const courseOccurrence = course[i];
          if (isSame(courseOccurrence, occurrence)) {
            tempSelected.push(courseOccurrence);
          }
        }
      });

      const tempDisabled = [];
      disabled.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id];
        if (!course) {
          return;
        }
        for (let i = 0; i < course.length; i++) {
          const courseOccurrence = course[i];
          if (isSame(courseOccurrence, occurrence)) {
            tempDisabled.push(courseOccurrence);
          }
        }
      });

      setChosenCourses(tempCourses);
      setSelectedOccurences(tempSelected);
      setDisabledOccurences(tempDisabled);
    };

    let courses = {};
    let selected = [];
    let disabled = [];
    if (
      localStorage.getItem("selectedOccurences") &&
      localStorage.getItem("disabledOccurences") &&
      localStorage.getItem("courses")&&
      localStorage.getItem("isAllowExamClash")
    ) {
      selected = JSON.parse(localStorage.getItem("selectedOccurences"));
      disabled = JSON.parse(localStorage.getItem("disabledOccurences"));
      courses = JSON.parse(localStorage.getItem("courses"));
      setIsAllowExamClash(JSON.parse(localStorage.getItem("isAllowExamClash")));
    } else {
      clearSavedState();
    }

    if (courses && selected && disabled) {
      fetchData(courses, selected, disabled);
    }
  }, []);

  // pasting an image anywhere on the page opens the import
  useEffect(() => {
    const handlePaste = (e) => {
      const image = Array.from(e.clipboardData.files).find((file) =>
        file.type.startsWith("image/")
      );
      if (image) {
        e.preventDefault();
        handleImportImage(image);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // check for clashing every time selectedOccurences or chosenCourses changes
  useEffect(() => {
    checkClashing(selectedOccurences, chosenCourses, isAllowExamClash);

    let totalCredits = 0;
    for (let i = 0; i < selectedOccurences.length; i++) {
      totalCredits += selectedOccurences[i].credits;
    }
    setCreditsAdded(totalCredits);
  }, [selectedOccurences, chosenCourses, isAllowExamClash]);

  // update local storage when state changes (not on initial render)
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
    } else {
      handleSaveState(chosenCourses, selectedOccurences, disabledOccurences, isAllowExamClash);
    }
  }, [chosenCourses, selectedOccurences, disabledOccurences, handleSaveState]);

  const checkClashing = (
    selectedOccurences,
    chosenCourses,
    isAllowExamClash
  ) => {
    const tempDisabledOccurences = [];

    selectedOccurences.forEach((occurence) => {
      Object.values(chosenCourses).forEach((courseOccurrences) => {
        courseOccurrences.forEach((courseOccurrence) => {
          // only check for clashing if the course is different
          if (
            occurence.course_id !== courseOccurrence.course_id &&
            isClashing(occurence, courseOccurrence, isAllowExamClash)
          ) {
            tempDisabledOccurences.push(courseOccurrence);
          }
        });
      });
    });

    setDisabledOccurences(tempDisabledOccurences);
  };

  const checkContains = (array, occurence) => {
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (isSame(element, occurence)) {
        return true;
      }
    }
    return false;
  };

  const isSame = (course1, course2) => {
    return (
      course1.course_id === course2.course_id &&
      course1.module === course2.module &&
      course1.occurence === course2.occurence
    );
  };

  // the modules that match what was typed in the search bar above them
  const visibleCourses = Object.entries(chosenCourses).filter(
    ([courseCode, occurrences]) => {
      const search = moduleFilter.trim().toLowerCase();
      const name = occurrences[0]?.mav_name || occurrences[0]?.module || "";
      return (
        courseCode.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search)
      );
    }
  );

  const toggleCourseExpansion = (courseCode) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseCode]: !prev[courseCode],
    }));
  };

  return (
    <div className={classes.home}>
      <Navbar />
      <AlertText alertText={alertText} setAlertText={setAlertText} />
      <div className={classes.homeContainer}>
        <SearchModal
          modal={searchModalVisible}
          toggle={toggleSearchModal}
          chosenCourses={chosenCourses}
          handleSearch={handleSearch}
          handleModuleSelection={handleAddModule}
          handleImportImage={handleImportImage}
          searchValue={searchValue}
        />
        <ImportModal
          modal={importModalVisible}
          toggle={toggleImportModal}
          file={importFile}
          handleImportModules={handleImportModules}
          handleErrorMessage={handleErrorMessage}
        />
        {/* <AnnouncementModal
          modal={announcementModalVisible}
          toggle={toggleAnnouncementModal}
          chosenCourses={chosenCourses}
        /> */}
        <div className={classes.layout}>
          <div className={classes.modulesPane}>
            <div className={classes.topControls}>
              {Object.keys(chosenCourses).length > 0 && (
                <button
                  onClick={handleResetModules}
                  className={classes.controlButton}
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    className={classes.controlIcon}
                  />
                  <span>Clear modules</span>
                </button>
              )}
            </div>
            {Object.keys(chosenCourses).length > 0 && (
              <div className={classes.moduleSearch}>
                <Searchbar
                  onChange={setModuleFilter}
                  value={moduleFilter}
                  placeholder={"Search your modules"}
                />
                {visibleCourses.length === 0 && (
                  <p className={classes.noMatches}>
                    No modules match your search
                  </p>
                )}
              </div>
            )}
            <div className={classes.occurrenceContainer}>
              {Object.keys(chosenCourses).length > 0 ? (
                visibleCourses.map(([courseCode, occurrences]) => {
                  const isExpanded = expandedCourses[courseCode];
                  return (
                    <div key={courseCode} className={classes.courseBlock}>
                      <div
                        className={`${classes.courseHeader} ${getCourseColorClass(
                          Object.keys(chosenCourses),
                          courseCode
                        )}`}
                        onClick={() => toggleCourseExpansion(courseCode)}
                      >
                        <div className={classes.courseHeaderContent}>
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`${classes.expandIcon} ${
                              isExpanded ? classes.expanded : ""
                            }`}
                          />
                          <p className={classes.courseName}>
                            {courseCode} -{" "}
                            {occurrences[0]?.mav_name
                              ? occurrences[0]?.mav_name
                              : occurrences[0].module}
                          </p>
                        </div>
                        <div
                          className={classes.removeButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveModule(courseCode);
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </div>
                      </div>
                      <div
                        className={`${classes.occurrences} ${
                          isExpanded ? classes.expanded : classes.collapsed
                        }`}
                      >
                        {occurrences.map((occurrence, occurrenceIndex) => {
                          const isDisabled = checkContains(
                            disabledOccurences,
                            occurrence
                          );
                          const isSelected = checkContains(
                            selectedOccurences,
                            occurrence
                          );
                          return (
                            <OccurrenceCard
                              key={occurrenceIndex}
                              onClick={handleOccurenceSelect}
                              occurrence={occurrence}
                              isDisabled={isDisabled}
                              isSelected={isSelected}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={classes.noCourses}>
                  <FontAwesomeIcon
                    className={classes.noCourseIcon}
                    icon={faCalendarDays}
                    size="2x"
                  />
                  <h1 className={classes.noCoursesHeader}>
                    Add Modules To Get Started!
                  </h1>
                  <p className={classes.noCoursesHint}>
                    You can also paste or upload a screenshot of your enrollment
                    and your modules and their occurrences are added for you.
                  </p>
                </div>
              )}
            </div>
            <div className={classes.controls}>
              <div className={classes.controlsLeft}>
                <button
                  onClick={handleResetTable}
                  className={classes.controlButton}
                >
                  <FontAwesomeIcon
                    icon={faRotateLeft}
                    className={classes.controlIcon}
                  />
                  <span>Reset table</span>
                </button>
              </div>
              <div className={classes.controlsRight}>
                <div className={classes.credits}>
                  <FontAwesomeIcon
                    icon={faStar}
                    className={classes.controlIcon}
                  />
                  <span>{creditsAdded} credits</span>
                </div>
              </div>
            </div>
            <AIModal
              modal={AIModalVisible}
              toggle={toggleAIModal}
              chosenCourses={chosenCourses}
              handleUpdateChosenCourses={handleUpdateChosenCourses}
              handleErrorMessage={handleErrorMessage}
              disabled={!(Object.keys(chosenCourses).length > 0)}
              isAllowExamClash={isAllowExamClash}
            />
            <div className={classes.togglesContainer}>
              <p>Allow exam clash</p>
              <ToggleSwitch
                isChecked={isAllowExamClash}
                onToggle={() => {
                  setIsAllowExamClash(!isAllowExamClash);
                }}
                className={classes.optionsToggle}
              />
            </div>
          </div>
          <div className={classes.timetablePane}>
            <div className={classes.tablesContainer}>
              <div>
                <Timetable
                  selectedOccurrences={selectedOccurences}
                  courseCodes={Object.keys(chosenCourses)}
                />
              </div>
              <ExamTimetable
                selectedOccurrences={selectedOccurences}
                courseCodes={Object.keys(chosenCourses)}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
