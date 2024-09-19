import "./App.css";
import { useEffect, useState } from "react";
import Timetable from "./components/Timetable";
import OccButton from "./components/OccButton";

function App() {
  const [courses, setCourses] = useState({});
  const [selectedOccurences, setSelectedOccurences] = useState([]);
  const [disabledOccurences, setDisabledOccurences] = useState([]);

  useEffect(() => {
    fetch("/one_week_schedule_occ_separated.json") // path to your json file
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
      console.log("disabled");
      for (let i = 0; i < selectedOccurences.length; i++) {
        if (selectedOccurences[i].course_id === selectedOccurence.course_id) {
          for (let j = i; j < selectedOccurences.length; j++) {
            if(isClashing(selectedOccurences[j], selectedOccurences[i]) && j !== i){
              console.log("clashing");
              return;
            }
          }
          const updatedSelectedOccurences = [...selectedOccurences];
          updatedSelectedOccurences[i] = selectedOccurence;
          setSelectedOccurences(updatedSelectedOccurences);
          checkClashing(updatedSelectedOccurences);
          return;
        }
      }
    } else {
      const updatedSelectedOccurences = [
        ...selectedOccurences,
        selectedOccurence,
      ];
      setSelectedOccurences(updatedSelectedOccurences);
      checkClashing(updatedSelectedOccurences);
    }
  };

  const checkClashing = (selectedOccurences) => {
    const tempDisabledOccurences = [];
    selectedOccurences.forEach((occurence) => {
      Object.values(courses).forEach((course) => {
        course.forEach((courseOccurence) => {
          if (
            courseOccurence !== occurence &&
            isClashing(occurence, courseOccurence)
          ) {
            tempDisabledOccurences.push(courseOccurence);
          }else if(courseOccurence.course_id === occurence.course_id && courseOccurence !== occurence){
            tempDisabledOccurences.push(courseOccurence);
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

    const parseTime = (day, time) => {
      if (day && time) {
        return new Date(`2024-09-17T${time}`);
      }
      return null;
    };

    // Check if lecture information exists for both courses
    if (!course1.lecture || !course2.lecture) {
      return false;
    }

    const lecture1Start = parseTime(
      course1.lecture.day,
      course1.lecture.begin_time
    );
    const lecture1End = parseTime(
      course1.lecture.day,
      course1.lecture.end_time
    );
    const lecture2Start = parseTime(
      course2.lecture.day,
      course2.lecture.begin_time
    );
    const lecture2End = parseTime(
      course2.lecture.day,
      course2.lecture.end_time
    );

    // Check if all necessary lecture times are available
    if (!lecture1Start || !lecture1End || !lecture2Start || !lecture2End) {
      return false;
    }

    const lectureClash =
      course1.lecture.day === course2.lecture.day &&
      timesOverlap(lecture1Start, lecture1End, lecture2Start, lecture2End);

    // Check for tutorial clash only if both courses have tutorial information
    if (
      course1.tutorial &&
      course2.tutorial &&
      course1.tutorial.day !== "NaN" &&
      course2.tutorial.day !== "NaN"
    ) {
      const tutorial1Start = parseTime(
        course1.tutorial.day,
        course1.tutorial.begin_time
      );
      const tutorial1End = parseTime(
        course1.tutorial.day,
        course1.tutorial.end_time
      );
      const tutorial2Start = parseTime(
        course2.tutorial.day,
        course2.tutorial.begin_time
      );
      const tutorial2End = parseTime(
        course2.tutorial.day,
        course2.tutorial.end_time
      );

      // Check if all necessary tutorial times are available
      if (tutorial1Start && tutorial1End && tutorial2Start && tutorial2End) {
        const tutorialClash =
          course1.tutorial.day === course2.tutorial.day &&
          timesOverlap(
            tutorial1Start,
            tutorial1End,
            tutorial2Start,
            tutorial2End
          );

        return lectureClash || tutorialClash;
      }
    }

    return lectureClash;
  };

  return (
    <div className="container">
      {courses &&
        Object.entries(courses).map(([courseName, occurrences], index) => {
          return (
            <div key={index} className="course-block">
              <h3>
                {courseName} - {occurrences[0].module}
              </h3>
              <div className="occurrences">
                {occurrences.map((occurrence, occurrenceIndex) => {
                  const isDisabled = disabledOccurences.includes(occurrence);
                  const isSelected = selectedOccurences.includes(occurrence);
                  return (
                    <OccButton
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
        })}
      <Timetable selectedOccurrences={selectedOccurences} />
    </div>
  );
}

export default App;
