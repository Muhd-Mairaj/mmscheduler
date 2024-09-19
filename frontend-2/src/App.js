import './App.css';
import { useEffect, useState } from 'react';
import Timetable from './components/Timetable';

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
      })
  }, []);

  useEffect(() => {
    console.log("selectedOccurences: ", selectedOccurences);
  }, [selectedOccurences]);

  useEffect(() => {
    console.log("disabledOccurences: ", disabledOccurences);
  }, [disabledOccurences]);

  const onOccurenceSelect = (selectedOccurence) => {
    console.log("selected: ", selectedOccurence);

    const updatedSelectedOccurences = [...selectedOccurences, selectedOccurence];
    setSelectedOccurences(updatedSelectedOccurences);
    checkClashing(updatedSelectedOccurences);
  }

  const checkClashing = (selectedOccurences) => {
    const tempDisabledOccurences = [];
    selectedOccurences.forEach(occurence => {
      Object.values(courses).forEach((course) => {
        course.forEach((courseOccurence) => {
          if (courseOccurence !== occurence && isClashing(occurence, courseOccurence)) {
            tempDisabledOccurences.push(courseOccurence);
          }
        });
      })
    });
    setDisabledOccurences(tempDisabledOccurences);
  }

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
    <div className="container">
      {courses && Object.entries(courses).map(([courseName, occurrences], index) => {
        return (
          <div key={index} className="course-block">
            <h3>{courseName} - {occurrences[0].module}</h3>
            <div className="occurrences">
              {occurrences.map((occurrence, occurrenceIndex) => {
                const isDisabled = disabledOccurences.includes(occurrence);
                const isSelected = selectedOccurences.includes(occurrence);
                return (
                  <button
                    key={occurrenceIndex}
                    className={`occurrence-button ${isDisabled ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => !isDisabled && onOccurenceSelect(occurrence)}
                  >
                    <div className="occurrence">
                      <div className="occ-number">{occurrence.occurence}</div>
                      <hr />
                      {occurrence.lecture && (
                        <div className="activity">
                          <div className="time">
                            {occurrence.lecture.day}
                            <br />
                            {occurrence.lecture.begin_time} - {occurrence.lecture.end_time}
                            {/* <div className="room">{occurrence.lecture.room}</div> */}
                          </div>
                        </div>
                      )}
                      <hr />
                      {occurrence.tutorial && (
                        <div className="activity">
                          <div className="time">
                            {occurrence.tutorial.day}
                            <br />
                            {occurrence.tutorial.begin_time} - {occurrence.tutorial.end_time}
                            {/* <div className="room">{occurrence.tutorial.room}</div> */}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
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
