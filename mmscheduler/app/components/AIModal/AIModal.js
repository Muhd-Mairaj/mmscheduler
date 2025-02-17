import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import Select from "react-select";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import classes from "./AIModal.module.css";
import isClashing from "@/app/functions/Home/isClashing";

const AIModal = ({
  modal,
  toggle,
  chosenCourses,
  handleUpdateChosenCourses,
  handleErrorMessage,
}) => {
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

  const checkClashing = (selectedOccurrences) => {
    for (let i = 0; i < selectedOccurrences.length; i++) {
      for (let j = i + 1; j < selectedOccurrences.length; j++) {
        if (isClashing(selectedOccurrences[i], selectedOccurrences[j])) {
          return true;
        }
      }
    }
    return false;
  };

  const handleGenerateSchedule = async () => {
    try {
      setIsLoading(true);
      console.log("Generating schedule...");
      console.log(
        "Tutor selections:",
        JSON.stringify(formatTutorSelections(tutorSelections))
      );
      console.log("Days off:", formatDaysOff(daysOff).toString());
      console.log("Prioritize lecturers:", prioritizeLecturers);

      const response = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_lecturers: JSON.stringify(
            formatTutorSelections(tutorSelections)
          ),
          preferred_days_off: formatDaysOff(daysOff).toString(),
          lecturers_more_important: prioritizeLecturers,
          daily_preference: "more spaced out",
          courses: JSON.stringify(chosenCourses),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate schedule");
      }

      const data = await response.json();

      if (!data?.llmAnswer?.value) {
        throw new Error("Invalid response format");
      }

      const returnedOccurrences = JSON.parse(data.llmAnswer.value).data;
      console.log("returnedOccurrences:", returnedOccurrences);

      const selectedOccurrences = returnedOccurrences.map(
        (returnedOccurrence) => {
          const availableOccurrences =
            chosenCourses[returnedOccurrence.course_id];
          if (!availableOccurrences) {
            throw new Error(
              `No available occurrences for course ${returnedOccurrence.course_id}`
            );
          }
          const selectedOccurrence = availableOccurrences.find(
            (availableOccurrence) =>
              availableOccurrence.occurence === returnedOccurrence.occurrence
          );
          if (!selectedOccurrence) {
            throw new Error(
              `No matching occurrence found for ${returnedOccurrence.course_id}`
            );
          }
          return selectedOccurrence;
        }
      );

      if (checkClashing(selectedOccurrences)) {
        throw new Error("Clashing modules detected. Please try again.");
      }

      handleUpdateChosenCourses(selectedOccurrences);
      console.log("Generated schedule successfully");
    } catch (error) {
      console.error("Error in handleGenerateSchedule:", error.message);
      handleErrorMessage(error.message);
    } finally {
      setIsLoading(false);
      toggle();
    }
  };

  useEffect(() => {
    if (chosenCourses) {
      const newTutorSelections = Object.entries(chosenCourses).reduce(
        (acc, [key, value]) => {
          const tutors = [
            ...new Set(
              value.flatMap((occurrence) =>
                [occurrence.lecture?.tutor, occurrence.tutorial?.tutor].filter(
                  Boolean
                )
              )
            ),
          ];

          acc[key] = {
            options: tutors.map((tutor) => ({ value: tutor, label: tutor })),
            selected: [],
          };
          return acc;
        },
        {}
      );

      setTutorSelections(newTutorSelections);
    }
  }, [chosenCourses]);

  const handleTutorSelectChange = (selectedOptions, key) => {
    setTutorSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: selectedOptions },
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
      <p className={classes.aiNote}>
        AI scheduling under maintenance due to high demand.
      </p>
      <RoundedButton
        className={`${classes.aiSchedulingButton} magicButton button`}
        // onClick={toggle}
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
            className={`${classes.AIModalContent} ${
              isLoading ? classes.blurBackground : ""
            }`}
          >
            <section>
              <h3>Select desired tutors:</h3>
              <div className={classes.tutorSelectionsContainer}>
                {Object.entries(tutorSelections).map(
                  ([key, { options, selected }]) => (
                    <div key={key} className={classes.selectContainer}>
                      <label htmlFor={key}>{key}</label>
                      <Select
                        id={key}
                        isMulti
                        options={options}
                        value={selected}
                        onChange={(selectedOptions) =>
                          handleTutorSelectChange(selectedOptions, key)
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
              <h3>Select desired days off:</h3>
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
              <h3>Prioritize lecturers over days off?</h3>
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
              *This feature is still in beta and may not provide a suitable
              schedule. <br></br>
              Please use manual scheduling if youre unable to generate it.
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
