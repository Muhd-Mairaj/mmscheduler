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
  const [chosenCourses, setChosenCourses] = useState([]);
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);
  const [modal, setModal] = useState(false);
  const [filteredData, setFilteredData] = useState(courses);
  const [searchValue, setSearchValue] = useState("");

  const toggle = () => setModal(!modal);

  const handleSearch = (e) => {
    const currentSearchValue = e.target.value;
    setSearchValue(currentSearchValue);
    const filter = Object.entries(courses).filter(([key, value]) => {
      return key
        .toLowerCase()
        .includes(currentSearchValue.trim().toLowerCase());
    });
    updateSearchData(filter, chosenCourses);
  };

  const updateSearchData = (data, chosenCourses) => {
    const filteredWithoutChosen = data.filter(
      ([key, value]) => !Object.keys(chosenCourses).includes(key)
    );
    setFilteredData(Object.fromEntries(filteredWithoutChosen.slice(0, 10)));
  };

  const handleAddModule = (key, value) => {
    const updatedCourses = {
      ...chosenCourses,
      [key]: value,
    };

    setChosenCourses(updatedCourses);
    updateSearchData(Object.entries(filteredData), updatedCourses);
    handleSaveState(updatedCourses, selectedOccurences, disabledOccurences);
  };

  const handleRemoveModule = (courseName) => {
    const updatedCourses = { ...chosenCourses };
    delete updatedCourses[courseName];
    const updatedSelectedOccurences = selectedOccurences.filter(
      (occurence) => occurence.course_id !== courseName
    );
    const updatedDisabledOccurences = disabledOccurences.filter(
      (occurence) => occurence.course_id !== courseName
    );
    setChosenCourses(updatedCourses);
    setDisabledOccurences(updatedDisabledOccurences);
    setSelectedOccurences(updatedSelectedOccurences);
    handleSaveState(
      updatedCourses,
      updatedSelectedOccurences,
      updatedDisabledOccurences
    );
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
    handleSaveState(
      chosenCourses,
      updatedSelectedOccurences,
      disabledOccurences
    );
    checkClashing(updatedSelectedOccurences);
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
    console.log("selectedOccurences: ", selectedOccurences);
  }, [selectedOccurences]);

  useEffect(() => {
    console.log("disabledOccurences: ", disabledOccurences);
  }, [disabledOccurences]);

  const checkClashing = (selectedOccurences) => {
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
              ([courseName, occurrences], index) => {
                return (
                  <div key={index} className={classes.courseBlock}>
                    <div className={classes.courseHeader}>
                      <div
                        className={classes.removeButton}
                        onClick={() => {
                          handleRemoveModule(courseName);
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                      <h3 className={classes.courseName}>
                        {courseName} - {occurrences[0].module}
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
          <RoundedButton
            className={`${classes.saveButton} acceptButton`}
            onClick={handleSaveImage}
          >
            Save Table Image
          </RoundedButton>
          <RoundedButton
            className={`${classes.saveButton} magicButton`}
            onClick={handleSaveImage}
          >
            <FontAwesomeIcon className={classes.buttonIcon} icon={faMagicWandSparkles} />
            <span className={classes.buttonText}>AI Scheduling</span>
          </RoundedButton>
        </div>
        <div className={classes.tableContainer}>
          <Timetable selectedOccurrences={selectedOccurences} ref={tableRef} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
