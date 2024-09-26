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
      ? timesOverlap(tutorial1Start, tutorial1End, tutorial2Start, tutorial2End)
      : false;

  return (
    lectureClash ||
    tutorialLectureClash ||
    lectureTutorialClash ||
    tutorialClash
  );
};

export default isClashing;
