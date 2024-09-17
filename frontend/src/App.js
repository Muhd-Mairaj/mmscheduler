import React, { useState } from "react";
import "./App.css";
import Timetable from "./components/Timetable/Timetable";
import jsonData from "./one_week_schedule_occ_separated.json";
import CardComponent from "./components/Card/Card";
import Section from "./components/Section/Section";

function App() {
  const [selectedCourses, setSelectedCourses] = useState([]);

  const addCourse = (course) => {
    setSelectedCourses([...selectedCourses, course]);
    console.log(selectedCourses);
  };

  const checkClash = (course) => {
    return selectedCourses.some((selectedCourse) => isClashing(course, selectedCourse));
  };

  function isClashing(course1, course2) {
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

    const lecture1Start = parseTime(course1.lecture.day, course1.lecture.begin_time);
    const lecture1End = parseTime(course1.lecture.day, course1.lecture.end_time);
    const lecture2Start = parseTime(course2.lecture.day, course2.lecture.begin_time);
    const lecture2End = parseTime(course2.lecture.day, course2.lecture.end_time);

    // Check if all necessary lecture times are available
    if (!lecture1Start || !lecture1End || !lecture2Start || !lecture2End) {
      return false;
    }

    const lectureClash =
      course1.lecture.day === course2.lecture.day &&
      timesOverlap(lecture1Start, lecture1End, lecture2Start, lecture2End);

    // Check for tutorial clash only if both courses have tutorial information
    if (course1.tutorial && course2.tutorial &&
        course1.tutorial.day !== "NaN" && course2.tutorial.day !== "NaN") {
      const tutorial1Start = parseTime(course1.tutorial.day, course1.tutorial.begin_time);
      const tutorial1End = parseTime(course1.tutorial.day, course1.tutorial.end_time);
      const tutorial2Start = parseTime(course2.tutorial.day, course2.tutorial.begin_time);
      const tutorial2End = parseTime(course2.tutorial.day, course2.tutorial.end_time);

      // Check if all necessary tutorial times are available
      if (tutorial1Start && tutorial1End && tutorial2Start && tutorial2End) {
        const tutorialClash =
          course1.tutorial.day === course2.tutorial.day &&
          timesOverlap(tutorial1Start, tutorial1End, tutorial2Start, tutorial2End);

        return lectureClash || tutorialClash;
      }
    }

    return lectureClash;
  }

  return (
    <div className="App">
      <h1>Courses</h1>
      <div className="all-modules">
        {Object.entries(jsonData).map(([key, value], index) => (
          <Section
            key={index}
            title={key}
            sectionData={value}
            addCourse={addCourse}
            checkClash={checkClash}
          />
        ))}
      </div>
      <Timetable jsonData={selectedCourses} />
    </div>
  );
}

export default App;
