"use client"

import classes from "./page.module.css"
import { useEffect, useState, useRef, useCallback } from "react"
import Timetable from "./components/Timetable/Timetable"
import OccurrenceCard from "./components/OccurrenceCard/OccurrenceCard"
import SearchModal from "./components/SearchModal/SearchModal"
import AnnouncementModal from "./components/AnnouncementModal/AnnouncementModal"
import {
  faTimes,
  faCalendarDays,
  faChevronDown,
  faCamera,
  faRotateLeft,
  faStar,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import isClashing from "./functions/Home/isClashing"
import Navbar from "./components/Navbar/Navbar"
import saveTableImage from "./functions/Home/saveTableImage"
import Footer from "./components/Footer/Footer"
import AlertText from "./components/AlertText/AlertText"
import AIModal from "./components/AIModal/AIModal"

const Home = () => {
  const [chosenCourses, setChosenCourses] = useState({})
  const [selectedOccurences, setSelectedOccurences] = useState([])
  const [disabledOccurences, setDisabledOccurences] = useState([])
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(true)
  const [AIModalVisible, setAIModalVisible] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [alertText, setAlertText] = useState("")
  const [expandedCourses, setExpandedCourses] = useState({})

  const toggleSearchModal = () => setSearchModalVisible(!searchModalVisible)
  const toggleAIModal = () => setAIModalVisible(!AIModalVisible)
  const toggleAnnouncementModal = () => setAnnouncementModalVisible(!announcementModalVisible)

  const handleSearch = (currentSearchValue) => {
    setSearchValue(currentSearchValue)
  }

  const handleErrorMessage = (message) => {
    setAlertText(message)
  }

  const handleUpdateChosenCourses = (newSelectedOccurrences) => {
    // Update all selected occurrences at once
    setSelectedOccurences(newSelectedOccurrences)
  }

  const handleResetTable = () => {
    setSelectedOccurences([])
    setDisabledOccurences([])
    localStorage.clear()
  }

  const handleResetModules = () => {
    setChosenCourses({})
    setSelectedOccurences([])
    setDisabledOccurences([])
    localStorage.clear()
  }

  const handleAddModule = (key, value) => {
    const updatedCourses = {
      ...chosenCourses,
      [key]: value,
    }
    setChosenCourses(updatedCourses)
  }

  const handleRemoveModule = (courseCode) => {
    const updatedCourses = { ...chosenCourses }
    delete updatedCourses[courseCode]
    const updatedSelectedOccurences = selectedOccurences.filter((occurence) => occurence.course_id !== courseCode)
    setChosenCourses(updatedCourses)
    setSelectedOccurences(updatedSelectedOccurences)
  }

  const handleOccurenceSelect = (selectedOccurence, isDisabled) => {
    if (isDisabled) {
      return
    }

    let updatedSelectedOccurences = []

    const isSameOccurence = selectedOccurences.some((occurence) => isSame(occurence, selectedOccurence))
    const isSameCourse = selectedOccurences.some((occurence) => occurence.course_id === selectedOccurence.course_id)

    // Note: same occurence means the same course and occurence
    // This must be checked before checking if only course is same
    if (isSameOccurence) {
      // unselect the occurence
      updatedSelectedOccurences = selectedOccurences.filter((occurence) => !isSame(occurence, selectedOccurence))
    } else if (isSameCourse) {
      // swap the occurence
      updatedSelectedOccurences = selectedOccurences.map((occurence) => {
        if (occurence.course_id === selectedOccurence.course_id) {
          return selectedOccurence
        }
        return occurence
      })
    } else {
      // add the occurence
      updatedSelectedOccurences = [...selectedOccurences, selectedOccurence]
    }

    setSelectedOccurences(updatedSelectedOccurences)
  }

  const tableRef = useRef()

  const handleSaveImage = () => {
    saveTableImage(tableRef)
  }

  const handleSaveState = useCallback((chosenCourses, selectedOccurences, disabledOccurences) => {
    localStorage.setItem("courses", JSON.stringify(chosenCourses))
    localStorage.setItem("selectedOccurences", JSON.stringify(selectedOccurences))
    localStorage.setItem("disabledOccurences", JSON.stringify(disabledOccurences))
  }, [])

  useEffect(() => {
    const fetchData = async (courses, selected, disabled) => {
      const tempCourses = await fetch("/api/get-courses-by-ids?query=" + Object.keys(courses).join(","))
        .then((res) => res.json())
        .then((data) => data)

      const tempSelected = []
      selected.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id]
        for (let i = 0; i < course.length; i++) {
          const courseOccurrence = course[i]
          if (isSame(courseOccurrence, occurrence)) {
            tempSelected.push(courseOccurrence)
          }
        }
      })

      const tempDisabled = []
      disabled.forEach((occurrence) => {
        const course = tempCourses[occurrence.course_id]
        for (let i = 0; i < tempCourses.length; i++) {
          const courseOccurrence = course[i]
          if (isSame(courseOccurrence, occurrence)) {
            tempDisabled.push(courseOccurrence)
          }
        }
      })

      setChosenCourses(tempCourses)
      setSelectedOccurences(tempSelected)
      setDisabledOccurences(tempDisabled)
    }

    let courses = {}
    let selected = []
    let disabled = []
    if (
      localStorage.getItem("selectedOccurences") &&
      localStorage.getItem("disabledOccurences") &&
      localStorage.getItem("courses")
    ) {
      selected = JSON.parse(localStorage.getItem("selectedOccurences"))
      disabled = JSON.parse(localStorage.getItem("disabledOccurences"))
      courses = JSON.parse(localStorage.getItem("courses"))
    } else {
      localStorage.clear()
    }

    if (courses && selected && disabled) {
      fetchData(courses, selected, disabled)
    }
  }, [])

  // check for clashing every time selectedOccurences or chosenCourses changes
  useEffect(() => {
    checkClashing(selectedOccurences, chosenCourses)

    let totalCredits = 0
    for (let i = 0; i < selectedOccurences.length; i++) {
      totalCredits += selectedOccurences[i].credits
    }
    setCreditsAdded(totalCredits)
  }, [selectedOccurences, chosenCourses])

  // update local storage when state changes (not on initial render)
  const hasMounted = useRef(false)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
    } else {
      handleSaveState(chosenCourses, selectedOccurences, disabledOccurences)
    }
  }, [chosenCourses, selectedOccurences, disabledOccurences, handleSaveState])

  const checkClashing = (selectedOccurences, chosenCourses) => {
    const tempDisabledOccurences = []

    selectedOccurences.forEach((occurence) => {
      Object.values(chosenCourses).forEach((courseOccurrences) => {
        courseOccurrences.forEach((courseOccurrence) => {
          // only check for clashing if the course is different
          if (occurence.course_id !== courseOccurrence.course_id && isClashing(occurence, courseOccurrence)) {
            tempDisabledOccurences.push(courseOccurrence)
          }
        })
      })
    })

    setDisabledOccurences(tempDisabledOccurences)
  }

  const checkContains = (array, occurence) => {
    for (let index = 0; index < array.length; index++) {
      const element = array[index]
      if (isSame(element, occurence)) {
        return true
      }
    }
    return false
  }

  const isSame = (course1, course2) => {
    return (
      course1.course_id === course2.course_id &&
      course1.module === course2.module &&
      course1.occurence === course2.occurence
    )
  }

  const toggleCourseExpansion = (courseCode) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseCode]: !prev[courseCode],
    }))
  }

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
        <div className={classes.topControls}>
          {Object.keys(chosenCourses).length > 0 && (
            <button onClick={handleResetModules} className={classes.controlButton}>
              <FontAwesomeIcon icon={faTimes} className={classes.controlIcon} />
              <span>Clear modules</span>
            </button>
          )}
        </div>
        <div className={classes.occurrenceContainer}>
          {Object.keys(chosenCourses).length > 0 ? (
            Object.entries(chosenCourses).map(([courseCode, occurrences], index) => {
              const isExpanded = expandedCourses[courseCode]
              return (
                <div key={index} className={classes.courseBlock}>
                  <div className={classes.courseHeader} onClick={() => toggleCourseExpansion(courseCode)}>
                    <div className={classes.courseHeaderContent}>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`${classes.expandIcon} ${isExpanded ? classes.expanded : ""}`}
                      />
                      <p className={classes.courseName}>
                        {courseCode} - {occurrences[0].module}
                      </p>
                    </div>
                    <div
                      className={classes.removeButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveModule(courseCode)
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                  </div>
                  <div className={`${classes.occurrences} ${isExpanded ? classes.expanded : classes.collapsed}`}>
                    {occurrences.map((occurrence, occurrenceIndex) => {
                      const isDisabled = checkContains(disabledOccurences, occurrence)
                      const isSelected = checkContains(selectedOccurences, occurrence)
                      return (
                        <OccurrenceCard
                          key={occurrenceIndex}
                          onClick={handleOccurenceSelect}
                          occurrence={occurrence}
                          isDisabled={isDisabled}
                          isSelected={isSelected}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : (
            <div className={classes.noCourses}>
              <FontAwesomeIcon className={classes.noCourseIcon} icon={faCalendarDays} size="2x" />
              <h1 className={classes.noCoursesHeader}>Add Modules To Get Started!</h1>
            </div>
          )}
        </div>
        <div className={classes.controls}>
          <div className={classes.controlsLeft}>
            <button onClick={handleSaveImage} className={classes.controlButton}>
              <FontAwesomeIcon icon={faCamera} className={classes.controlIcon} />
              <span>Save image</span>
            </button>
            <button onClick={handleResetTable} className={classes.controlButton}>
              <FontAwesomeIcon icon={faRotateLeft} className={classes.controlIcon} />
              <span>Reset table</span>
            </button>
          </div>
          <div className={classes.controlsRight}>
            <div className={classes.credits}>
              <FontAwesomeIcon icon={faStar} className={classes.controlIcon} />
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
        />
        <div className={classes.tableContainer}>
          <Timetable selectedOccurrences={selectedOccurences} ref={tableRef} />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home

