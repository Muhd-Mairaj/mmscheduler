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

  // Check if there are activities in both courses
  if (!course1.activities || !course2.activities) {
    return false;
  }

  // Helper function to check for activity clashes
  function checkActivityClashes(activity1, activity2) {
    const [activity1Start, activity1End] = parseTime(
      activity1.day,
      activity1.begin_time,
      activity1.end_time
    );

    const [activity2Start, activity2End] = parseTime(
      activity2.day,
      activity2.begin_time,
      activity2.end_time
    );

    // Check if times are valid
    if (!activity1Start || !activity1End || !activity2Start || !activity2End) {
      return false;
    }

    return timesOverlap(activity1Start, activity1End, activity2Start, activity2End);
  }

  // Loop through all combinations of activities
  for (const activity1 of course1.activities) {
    for (const activity2 of course2.activities) {
      // Check if both activities have the same day
      if (activity1.day === activity2.day) {
        // Check if activities clash
        if (checkActivityClashes(activity1, activity2)) {
          return true; // Clash found
        }
      }
    }
  }

  return false; // No clash found

  // return (
  //   lectureClash ||
  //   tutorialLectureClash ||
  //   lectureTutorialClash ||
  //   tutorialClash
  // );
};

export default isClashing;
