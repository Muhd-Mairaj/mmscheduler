import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import Select from "react-select";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import classes from "./AIModal.module.css";

const AIModal = ({
  modal,
  toggle,
  chosenCourses,
  handleUpdateChosenCourses,
  handleErrorMessage,
  disabled=false,
  isAllowExamClash=false
}) => {
  const [positiveTutorSelections, setPositiveTutorSelections] = useState({});
  const [negativeTutorSelections, setNegativeTutorSelections] = useState({});
  const [tutorSelections, setTutorSelections] = useState({});
  const [daysOff, setDaysOff] = useState([]);
  const [prioritizeLecturers, setPrioritizeLecturers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const formatTutorSelections = (tutorSelections) => {
    return Object.entries(tutorSelections).reduce((acc, [key, value]) => {
      acc[key] = value.selected.map((option) => option.value);
      return acc;
    }, {});
  };

  const formatDaysOff = (daysOff) => {
    return daysOff.map((option) => option.value);
  };

  const handleGenerateSchedule = () => {
    setIsLoading(true);

    const negative_days = formatDaysOff(daysOff);
    const positive_tutors = formatTutorSelections(positiveTutorSelections);
    const negative_tutors = formatTutorSelections(negativeTutorSelections);
    const lecturers_more_important = prioritizeLecturers;
    const courses = chosenCourses;
    const is_allow_exam_clash = isAllowExamClash;

    // Instantiate the Web Worker correctly
    const worker = new Worker(new URL('../../functions/AIModal/evaluateScheduleWorker.js', import.meta.url));

    worker.postMessage({
      courses,
      positiveTutors: positive_tutors,
      negativeTutors: negative_tutors,
      negativeDays: negative_days,
      prioritizeLecturers: lecturers_more_important,
      isAllowExamClash: is_allow_exam_clash
    });

    // Handle the response from the worker
    worker.onmessage = function (e) {
      const generatedSchedule = e.data;

      if (generatedSchedule) {
        handleUpdateChosenCourses(generatedSchedule);
        console.log("Generated schedule successfully", generatedSchedule);
        toggle();
      } else {
        console.error("Failed to generate schedule");
        handleErrorMessage("Failed to generate schedule, courses may be clashing");
      }

      // Stop loading
      setIsLoading(false);
    };

    worker.onerror = function (error) {
      console.error("Worker error:", error.message);
      handleErrorMessage(error.message);
      setIsLoading(false);
    };

    console.log("preferred_days_off", negative_days);
    console.log("positive_tutors", positive_tutors);
    console.log("negative_tutors", negative_tutors);
    console.log("lecturers_more_important", lecturers_more_important);
    console.log("courses", courses);
  };

  useEffect(() => {
    if (chosenCourses && Object.keys(chosenCourses).length > 0) {
      const newTutorSelections = Object.entries(chosenCourses).reduce(
        (acc, [key, courseOccurrences]) => {
          if (courseOccurrences && courseOccurrences.length > 0) {
            const tutors = [
              ...new Set(
                courseOccurrences.flatMap((occurrence) =>
                  occurrence.activities.map((activity) => activity.tutor)
                )
              ),
            ];

            acc[key] = tutors.map((tutor) => ({ value: tutor, label: tutor }));
          }
          return acc;
        },
        {}
      );

      setTutorSelections(newTutorSelections);
      setPositiveTutorSelections(
        Object.keys(newTutorSelections).reduce((acc, key) => {
          acc[key] = { options: newTutorSelections[key], selected: [] };
          return acc;
        }, {})
      );
      setNegativeTutorSelections(
        Object.keys(newTutorSelections).reduce((acc, key) => {
          acc[key] = { options: newTutorSelections[key], selected: [] };
          return acc;
        }, {})
      );
    } else {
      setTutorSelections({});
      setPositiveTutorSelections({});
      setNegativeTutorSelections({});
    }
  }, [chosenCourses]);

  const handlePositiveTutorSelectChange = (selectedOptions, key) => {
    setPositiveTutorSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: selectedOptions },
    }));

    setNegativeTutorSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        options: tutorSelections[key].filter(
          (option) => !selectedOptions.some((selected) => selected.value === option.value)
        ),
      },
    }));
  };

  const handleNegativeTutorSelectChange = (selectedOptions, key) => {
    setNegativeTutorSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: selectedOptions },
    }));

    setPositiveTutorSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        options: tutorSelections[key].filter(
          (option) => !selectedOptions.some((selected) => selected.value === option.value)
        ),
      },
    }));
  };

  const handleDaysOffChange = (selectedOptions) => {
    setDaysOff(selectedOptions);
  };

  const handlePrioritizeToggle = () => {
    setPrioritizeLecturers((prev) => !prev);
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ].map((day) => ({ value: day, label: day }));

  return (
    <>
      {/* {<p className={classes.aiNote}>
        AI scheduling under maintenance due to high demand.
      </p>} */}
      <RoundedButton
        className={`${classes.aiSchedulingButton} magicButton button`}
        onClick={toggle}
        disabled={disabled}
      >
        <FontAwesomeIcon
          className={classes.buttonIcon}
          icon={faMagicWandSparkles}
        />
        <span className={classes.buttonText}>AI Scheduling</span>
      </RoundedButton>

      <Modal isOpen={modal} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>AI Scheduling</ModalHeader>
        <ModalBody>
          <div
            className={`${classes.AIModalContent} ${isLoading ? classes.blurBackground : ""
              }`}
          >
            <section>
              <h2>Select desired tutors:</h2>
              <div className={classes.tutorSelectionsContainer}>
                {Object.entries(positiveTutorSelections).map(
                  ([key, { options, selected }]) => (
                    <div key={key} className={classes.selectContainer}>
                      <label htmlFor={`positive-${key}`}>
                        {key} - {chosenCourses[key] && chosenCourses[key][0]?.module}
                      </label>
                      <Select
                        id={`lecturers - ${key}`}
                        isMulti
                        options={options}
                        value={selected}
                        onChange={(selectedOptions) =>
                          handlePositiveTutorSelectChange(selectedOptions, key)
                        }
                        className={classes.multiSelect}
                        isSearchable={false}
                      />
                    </div>
                  )
                )}
              </div>
              <h2>Select undesired tutors:</h2>
              <div className={classes.tutorSelectionsContainer}>
                {Object.entries(negativeTutorSelections).map(
                  ([key, { options, selected }]) => (
                    <div key={key} className={classes.selectContainer}>
                      <label htmlFor={`negative-${key}`}>
                        {key} - {chosenCourses[key] && chosenCourses[key][0]?.module}
                      </label>
                      <Select
                        id={`negative-${key}`}
                        isMulti
                        options={options}
                        value={selected}
                        onChange={(selectedOptions) =>
                          handleNegativeTutorSelectChange(selectedOptions, key)
                        }
                        className={classes.multiSelect}
                        isSearchable={false}
                      />
                    </div>
                  )
                )}
              </div>
            </section>
            <hr />
            <section>
              <h2>Select desired days off:</h2>
              <div className={classes.daysSelectionContainer}>
                <Select
                  isMulti
                  options={daysOfWeek}
                  value={daysOff}
                  onChange={handleDaysOffChange}
                  className={classes.multiSelect}
                  isSearchable={false}
                />
              </div>
            </section>
            <hr />
            <section className={classes.toggleSection}>
              <h2>Prioritize lecturers over days off?</h2>
              <ToggleSwitch
                isChecked={prioritizeLecturers}
                onToggle={handlePrioritizeToggle}
              />
            </section>
            <hr />
          </div>
          {isLoading && (
            <div className={classes.loadingOverlay}>
              <p className={classes.loadingText}>
                Working some magic{" "}
                <FontAwesomeIcon icon={faMagicWandSparkles} />
                ...
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <small>
            <i>
              *credits to <a className={classes.creditsLink} href="https://github.com/AzzamAlsharafi/" target="_blank">@Azzam</a> for algorithm idea.
            </i>
          </small>
          <RoundedButton
            className={`${classes.closeButton} magicButton`}
            onClick={handleGenerateSchedule}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faMagicWandSparkles} />
            <span className={classes.buttonText}>Generate Schedule</span>
          </RoundedButton>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AIModal;
