import "./App.css";
import { useEffect, useState, useRef } from "react";
import Timetable from "./components/Timetable";
import OccurrenceCard from "./components/OccurrenceCard/OccurrenceCard";
import html2canvas from "html2canvas";
import SearchModal from "./components/SearchModal/SearchModal";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function App() {
  const [courses, setCourses] = useState({});
  const [chosenCourses, setChosenCourses] = useState([]);
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);
  const [modal, setModal] = useState(false);
  const [filteredData, setFilteredData] = useState(courses);
  const [searchValue, setSearchValue] = useState("");

  const toggle = () => setModal(!modal);

  const handleModuleSelection = (key, value) => {
    const updatedCourses = {
      ...chosenCourses,
      [key]: value,
    };

    setChosenCourses(updatedCourses);
    updateSearchData(Object.entries(filteredData), updatedCourses);
  };

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

  const handleRemoveModule = (e) => {
    const courseHeader = e.target.parentElement.querySelector("h3");

    if (courseHeader) {
      const courseName = courseHeader.textContent.split(" - ")[0];

      // Remove course from chosenCourses
      const updatedCourses = { ...chosenCourses };
      delete updatedCourses[courseName];
      setChosenCourses(updatedCourses);

      // Remove all occurrences related to the removed course
      const updatedSelectedOccurrences = selectedOccurences.filter(
        (occurence) => occurence.course_id !== courseName
      );
      setSelectedOccurences(updatedSelectedOccurrences);

      // Update the search data
      updateSearchData(Object.entries(filteredData), updatedCourses);
    } else {
      console.error("Course header not found");
    }

    handleSaveState();
  };

  const tableRef = useRef();

  const handleSave = () => {
    html2canvas(tableRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "table_image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleSaveState = () => {
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

  const handleOccurenceSelect = (selectedOccurence, isDisabled) => {
    console.log("selected: ", selectedOccurence);

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
    checkClashing(updatedSelectedOccurences);
  };

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

  const isClashing = (course1, course2) => {
    const timesOverlap = (start1, end1, start2, end2) => {
      return start1 < end2 && start2 < end1;
    };

    const parseTime = (day, startTime, endTime) => {
      if (day && startTime) {
        const dayMinuteMap = {
          monday: 0 * 24 * 60,
          tuesday: 1 * 24 * 60,
          wednesday: 2 * 24 * 60,
          thursday: 3 * 24 * 60,
          friday: 4 * 24 * 60,
          saturday: 5 * 24 * 60,
          sunday: 6 * 24 * 60,
        };

        const dayInMinutes = dayMinuteMap[day.toLowerCase()];

        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        const startMinutes = dayInMinutes + startHour * 60 + startMinute;
        const endMinutes = dayInMinutes + endHour * 60 + endMinute;

        return [startMinutes, endMinutes];
      }
      return [null, null];
    };

    // Check if lecture information exists for both courses
    if (!course1.lecture || !course2.lecture) {
      return false;
    }

    // parse lecture1 times
    const [lecture1Start, lecture1End] = parseTime(
      course1.lecture.day,
      course1.lecture.begin_time,
      course1.lecture.end_time
    );

    // parse lecture2 times
    const [lecture2Start, lecture2End] = parseTime(
      course2.lecture.day,
      course2.lecture.begin_time,
      course2.lecture.end_time
    );

    // Check if all necessary lecture times are available
    if (!lecture1Start || !lecture1End || !lecture2Start || !lecture2End) {
      return false;
    }

    // parse tutorial1 times
    const [tutorial1Start, tutorial1End] = course1.tutorial
      ? parseTime(
          course1.tutorial.day,
          course1.tutorial.begin_time,
          course1.tutorial.end_time
        )
      : [null, null];

    // parse tutorial2 times
    const [tutorial2Start, tutorial2End] = course2.tutorial
      ? parseTime(
          course2.tutorial.day,
          course2.tutorial.begin_time,
          course2.tutorial.end_time
        )
      : [null, null];

    // check all combinations of tuturial and lecture clash
    const lectureClash = timesOverlap(
      lecture1Start,
      lecture1End,
      lecture2Start,
      lecture2End
    );
    const tutorialLectureClash = course1.tutorial
      ? timesOverlap(tutorial1Start, tutorial1End, lecture2Start, lecture2End)
      : false;
    const lectureTutorialClash = course2.tutorial
      ? timesOverlap(lecture1Start, lecture1End, tutorial2Start, tutorial2End)
      : false;
    const tutorialClash =
      course1.tutorial && course2.tutorial
        ? timesOverlap(
            tutorial1Start,
            tutorial1End,
            tutorial2Start,
            tutorial2End
          )
        : false;

    return (
      lectureClash ||
      tutorialLectureClash ||
      lectureTutorialClash ||
      tutorialClash
    );
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
    <div className="app-container">
      <h1 className="logo">MMScheduler 2.0</h1>
      <SearchModal
        modal={modal}
        toggle={toggle}
        data={filteredData}
        handleSearch={handleSearch}
        handleModuleSelection={handleModuleSelection}
        searchValue={searchValue}
      />
      <div className="occurrence-container">
        {Object.keys(chosenCourses).length > 0 ? (
          Object.entries(chosenCourses).map(
            ([courseName, occurrences], index) => {
              return (
                <div key={index} className="course-block">
                  <button
                    className={"button remove-course-button"}
                    onClick={handleRemoveModule}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  <h3>
                    {courseName} - {occurrences[0].module}
                  </h3>
                  <div className="occurrences">
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
          <h1 className="no-courses-header"> No courses selected </h1>
        )}
      </div>
      <button className={"button save-button"} onClick={handleSave}>
        Save Table Image
      </button>
      <button className={"button"} onClick={handleSaveState}>
        Save Selected courses
      </button>
      <div className="table-container">
        <Timetable selectedOccurrences={selectedOccurences} ref={tableRef} />
      </div>
    </div>
  );
}

export default App;
