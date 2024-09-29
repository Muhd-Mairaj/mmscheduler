import "../Global.css";
import classes from "./Home.module.css";
import { useEffect, useState, useRef } from "react";
import Timetable from "../components/Timetable/Timetable";
import OccurrenceCard from "../components/OccurrenceCard/OccurrenceCard";
import SearchModal from "../components/SearchModal/SearchModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCalendarDays, faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import RoundedButton from "../components/RoundedButton/RoundedButton";
import isClashing from "../functions/Home/isClashing";
import Navbar from "../components/Navbar/Navbar";
import saveTableImage from "../functions/Home/saveTableImage";
import Footer from "../components/Footer/Footer";

function Home() {
  const [courses, setCourses] = useState({});
  const [chosenCourses, setChosenCourses] = useState({});
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);
  const [modal, setModal] = useState(false);
  const [filteredData, setFilteredData] = useState(courses);
  const [searchValue, setSearchValue] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [creditsSelected, setCreditsSelected] = useState(0);

  const toggle = () => setModal(!modal);

  const handleSearch = (currentSearchValue) => {
    setSearchValue(currentSearchValue);
  };

  const updateSearchData = (courses, chosenCourses, searchValue) => {
    const filteredWithoutChosen = Object.entries(courses).filter(([key, value]) => {
      return (
        (key.toLowerCase().includes(searchValue.trim().toLowerCase())
          ||
          value[0].module.toLowerCase().includes(searchValue.trim().toLowerCase())
        )
        &&
        !Object.keys(chosenCourses).includes(key)
      )
    })

    setFilteredData(Object.fromEntries(filteredWithoutChosen.slice(0, 10)));
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
    if (
      localStorage.getItem("selectedOccurences") &&
      localStorage.getItem("disabledOccurences") &&
      localStorage.getItem("courses")
    ) {
      setSelectedOccurences(
        JSON.parse(localStorage.getItem("selectedOccurences"))
      );
      setDisabledOccurences(
        JSON.parse(localStorage.getItem("disabledOccurences"))
      );
      setChosenCourses(JSON.parse(localStorage.getItem("courses")));
    } else {

      setSelectedOccurences([]);
      setDisabledOccurences([]);
      localStorage.clear();
    }

    fetch("/all_courses_updated_one_week_schedule_occ_separated.json") // path to json file
      .then((response) => response.json())
      .then((data) => {
        setCourses(data);
        console.log(data);
      });
  }, []);

  useEffect(() => {
    console.log("chosenCourses: ", chosenCourses);
    const credits = Object.entries(chosenCourses).reduce((total, [key, value]) => {
      return total + value[0].credits;
    }, 0);
    setCreditsAdded(credits);
  }, [chosenCourses]);

  useEffect(() => {
    console.log("selectedOccurences: ", selectedOccurences);
    const credits = selectedOccurences.reduce((total, selectedOccurence) => {
      return total + selectedOccurence.credits;
    }, 0)
    setCreditsSelected(credits);
  }, [selectedOccurences]);

  useEffect(() => {
    console.log("disabledOccurences: ", disabledOccurences);
  }, [disabledOccurences]);

  useEffect(() => {
    updateSearchData(courses, chosenCourses, searchValue);
  }, [courses, chosenCourses, searchValue]);

  // check for clashing every time selectedOccurences or chosenCourses changes
  useEffect(() => {
    checkClashing(selectedOccurences, chosenCourses);
  }, [selectedOccurences, chosenCourses]);

  // update local storage when state changes (not on initial render)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
    }
    else {
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
      <div className={classes.homeContainer}>
        <SearchModal
          modal={modal}
          toggle={toggle}
          data={filteredData}
          handleSearch={handleSearch}
          handleModuleSelection={handleAddModule}
          searchValue={searchValue}
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
        <RoundedButton
          className={`${classes.saveButton} acceptButton`}
          onClick={handleSaveImage}
        >
          Save Table Image
        </RoundedButton>
        <RoundedButton
          className={`${classes.saveButton} acceptButton`}
          onClick={() => { return; }}
        >
          Total Credits Added: {creditsAdded}
        </RoundedButton>
        <RoundedButton
          className={`${classes.saveButton} acceptButton`}
          onClick={() => { return; }}
        >
          Total Credits Selected: {creditsSelected}
        </RoundedButton>
        <div className={classes.tableContainer}>
          <Timetable selectedOccurrences={selectedOccurences} ref={tableRef} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
