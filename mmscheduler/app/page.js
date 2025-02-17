"use client";

import classes from "./page.module.css";
import { useEffect, useState, useRef } from "react";
import Timetable from "./components/Timetable/Timetable";
import OccurrenceCard from "./components/OccurrenceCard/OccurrenceCard";
import SearchModal from "./components/SearchModal/SearchModal";
import AnnouncementModal from "./components/AnnouncementModal/AnnouncementModal";
import AIModal from "./components/AIModal/AIModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import RoundedButton from "./components/RoundedButton/RoundedButton";
import isClashing from "./functions/Home/isClashing";
import Navbar from "./components/Navbar/Navbar";
import saveTableImage from "./functions/Home/saveTableImage";
import Footer from "./components/Footer/Footer";
import AlertText from "./components/AlertText/AlertText";

const Home = () => {
  const [chosenCourses, setChosenCourses] = useState([]);
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(true);
  const [AIModalVisible, setAIModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [alertText, setAlertText] = useState("");

  const toggleSearchModal = () => setSearchModalVisible(!searchModalVisible);
  const toggleAIModal = () => setAIModalVisible(!AIModalVisible);
  const toggleAnnouncementModal = () => setAnnouncementModalVisible(!announcementModalVisible);

  const handleSearch = (currentSearchValue) => {
    setSearchValue(currentSearchValue);
  };

  const handleErrorMessage = (message) => {
    setAlertText(message);
  };

  const handleUpdateChosenCourses = (newChosenCoursesData) => {
    handleResetTable();

    let newSelectedOccurrences = [];

    for (let i = 0; i < newChosenCoursesData.length; i++) {
      const chosenOccurrence = newChosenCoursesData[i];
      console.log(chosenOccurrence);
      const course = chosenCourses[chosenOccurrence.course_id];
      console.log(course);
      for (let j = 0; j < course.length; j++) {
        const occurrence = course[j];
        if (
          String(occurrence.occurence) === String(chosenOccurrence.occurrence)
        ) {
          console.log("Found matching occurrence");
          newSelectedOccurrences.push(occurrence);
          // Don't break here, allow multiple matches per course
        }
      }
    }

    // Update all selected occurrences at once
    setSelectedOccurences(newSelectedOccurrences);
  };

  const handleResetTable = () => {
    setSelectedOccurences([]);
    setDisabledOccurences([]);
    localStorage.clear();
  };

  const handleResetModules = () => {
    setChosenCourses([]);
    setSelectedOccurences([]);
    setDisabledOccurences([]);
    localStorage.clear();
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

  const tableRef = useRef();

  const handleSaveImage = () => {
    saveTableImage(tableRef);
  };

  const handleSaveState = (
    chosenCourses,
    selectedOccurences,
    disabledOccurences
  ) => {
    localStorage.setItem("courses", JSON.stringify(chosenCourses));
    localStorage.setItem(
      "selectedOccurences",
      JSON.stringify(selectedOccurences)
    );
    localStorage.setItem(
      "disabledOccurences",
      JSON.stringify(disabledOccurences)
    );
  };

  useEffect(() => {
    const fetchData = async (courses, selected, disabled) => {
      const tempCourses = await fetch("/api/get-courses-by-ids?query=" + Object.keys(courses).join(","))
        .then((res) => res.json())
        .then((data) => data);


      const tempSelected = [];
      selected.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id];
        for (let i = 0; i < course.length; i++) {
          const courseOccurrence = course[i];
          if (isSame(courseOccurrence, occurrence)) {
            tempSelected.push(courseOccurrence);
          }
        }
      })

      const tempDisabled = [];
      disabled.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id];
        for (let i = 0; i < tempCourses.length; i++) {
          const courseOccurrence = course[i];
          if (isSame(courseOccurrence, occurrence)) {
            tempDisabled.push(courseOccurrence);
          }
        }
      })

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
      localStorage.getItem("courses")
    ) {
      selected = JSON.parse(localStorage.getItem("selectedOccurences"));
      disabled = JSON.parse(localStorage.getItem("disabledOccurences"));
      courses = JSON.parse(localStorage.getItem("courses"));
    } else {
      localStorage.clear();
    }

    if (courses && selected && disabled) {
      fetchData(courses, selected, disabled);
    }
  }, []);

  // check for clashing every time selectedOccurences or chosenCourses changes
  useEffect(() => {
    checkClashing(selectedOccurences, chosenCourses);

    let totalCredits = 0;
    for (let i = 0; i < selectedOccurences.length; i++) {
      totalCredits += selectedOccurences[i].credits;
    }
    setCreditsAdded(totalCredits);
  }, [selectedOccurences, chosenCourses]);

  // update local storage when state changes (not on initial render)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
    } else {
      handleSaveState(chosenCourses, selectedOccurences, disabledOccurences);
    }
  }, [chosenCourses, selectedOccurences, disabledOccurences]);

  const checkClashing = (selectedOccurences, chosenCourses) => {
    const tempDisabledOccurences = [];

    selectedOccurences.forEach((occurence) => {
      Object.values(chosenCourses).forEach((courseOccurrences) => {
        courseOccurrences.forEach((courseOccurrence) => {
          // only check for clashing if the course is different
          if (
            occurence.course_id !== courseOccurrence.course_id &&
            isClashing(occurence, courseOccurrence)
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
          searchValue={searchValue}
          />
        <AnnouncementModal
          modal={announcementModalVisible}
          toggle={toggleAnnouncementModal}
          chosenCourses={chosenCourses}
          />
        <div className={classes.occurrenceContainer}>
          {Object.keys(chosenCourses).length > 0 ? (
            Object.entries(chosenCourses).map(
              ([courseCode, occurrences], index) => {
                return (
                  <div key={index} className={classes.courseBlock}>
                    <div className={classes.courseHeader}>
                      <div
                        className={classes.removeButton}
                        onClick={() => {
                          handleRemoveModule(courseCode);
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                      <h3 className={classes.courseName}>
                        {courseCode} - {occurrences[0].module}
                      </h3>
                    </div>
                    <div className={classes.occurrences}>
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
              }
            )
          ) : (
            <div className={classes.noCourses}>
              <FontAwesomeIcon
                className={classes.noCourseIcon}
                icon={faCalendarDays}
                size="2x"
              />
              <h1 className={classes.noCoursesHeader}>
                {" "}
                Add Modules To Get Started!{" "}
              </h1>
            </div>
          )}
        </div>
        <div className={classes.actionButtons}>
          <div className={classes.leftButtons}>
            {Object.keys(chosenCourses).length > 0 && (
              <div className={classes.buttonColumn}>
                <RoundedButton
                  className={`${classes.creditsButton} button`}
                >
                  Total Credits: {creditsAdded}
                </RoundedButton>
                <AIModal
                  modal={AIModalVisible}
                  toggle={toggleAIModal}
                  chosenCourses={chosenCourses}
                  handleUpdateChosenCourses={handleUpdateChosenCourses}
                  handleErrorMessage={handleErrorMessage}
                />
              </div>
            )}
            <RoundedButton
              className={`${classes.saveButton} acceptButton button`}
              onClick={handleSaveImage}
            >
              Save Table Image
            </RoundedButton>
          </div>
          <div className={classes.rightButtons}>
            <RoundedButton
              className={`${classes.resetButton} acceptButton button`}
              onClick={() => {
                handleResetModules();
              }}
            >
              Reset Modules
            </RoundedButton>
            <RoundedButton
              className={`${classes.resetButton} acceptButton button`}
              onClick={() => {
                handleResetTable();
              }}
            >
              Reset Table
            </RoundedButton>
          </div>
        </div>
        <div className={classes.tableContainer}>
          <Timetable selectedOccurrences={selectedOccurences} ref={tableRef} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
