const COLOR_COUNT = 10;

// The class (in globals.css) with the colour of a module, modules get them in the order they were added
export const getCourseColorClass = (courseCodes, courseCode) => {
  const index = Math.max(0, courseCodes.indexOf(courseCode));
  return `course-color-${index % COLOR_COUNT}`;
};
