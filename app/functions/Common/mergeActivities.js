// The timetable data lists a class once for every lecturer that teaches it (and sometimes
// once more without a lecturer), so the same class showed up several times.
// This merges them into one class with all of its lecturers.
const mergeActivities = (activities) => {
  const classes = new Map();

  activities.forEach((activity) => {
    const key = [
      activity.title,
      activity.day,
      activity.begin_time,
      activity.end_time,
      activity.room,
      activity.start_date,
    ].join("|");

    if (!classes.has(key)) {
      classes.set(key, { activity: { ...activity }, tutors: [] });
    }

    const { tutors } = classes.get(key);
    if (activity.tutor && !tutors.includes(activity.tutor)) {
      tutors.push(activity.tutor);
    }
  });

  return [...classes.values()].map(({ activity, tutors }) => {
    if (tutors.length > 0) {
      activity.tutor = tutors.join(", ");
    } else {
      delete activity.tutor;
    }
    return activity;
  });
};

// Same thing for the whole timetable data ({ courseCode: occurrences[] })
export const mergeCourseActivities = (courses) => {
  return Object.fromEntries(
    Object.entries(courses).map(([code, occurrences]) => [
      code,
      occurrences.map((occurrence) => ({
        ...occurrence,
        activities: mergeActivities(occurrence.activities),
      })),
    ])
  );
};

export default mergeActivities;
