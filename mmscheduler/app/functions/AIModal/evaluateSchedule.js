import isClashing from "../Home/isClashing";

const evaluateSchedule = (
  selectedCourses,
  positiveTutors,
  negativeTutors,
  negativeDays,
  isTutorOverDays,
  isAllowExamClash
) => {
  //get all possible non-clashing occ combinations
  //make sure not clashing
  //evaluate score for each combination
  //git maximum score
  const allCombinations = getAllCombinations(selectedCourses);
  let maxScore = -99999;
  let maxScoreCombination = null;
  for (let i = 0; i < allCombinations.length; i++) {
    const combination = allCombinations[i];
    if (!checkClashing(combination, isAllowExamClash)) {
      let evaluation = evaluateCombination(
        combination,
        positiveTutors,
        negativeTutors,
        negativeDays,
        isTutorOverDays
      );
      if (evaluation > maxScore) {
        maxScoreCombination = combination;
        maxScore = evaluation;
      }
    }
  }
  return maxScoreCombination;
};

const evaluateCombination = (
  combination,
  positiveTutors,
  negativeTutors,
  negativeDays,
  isTutorOverDays
) => {
  let score = 0;
  for (let i = 0; i < combination.length; i++) {
    const occurrence = combination[i];
    const occurrenceActivities = occurrence.activities;
    const tutors = [];
    for (let j = 0; j < occurrenceActivities.length; j++) {
      const activity = occurrenceActivities[j];
      if (activity.tutor) {
        const tutor = activity.tutor;
        const courseId = occurrence.course_id;

        const isPositive =
          positiveTutors[courseId] && positiveTutors[courseId].includes(tutor);
        const isNegative =
          negativeTutors[courseId] && negativeTutors[courseId].includes(tutor);

        if (isPositive) {
          score += isTutorOverDays ? 3 : 2;
          if (!tutors.includes(tutor)) {
            score += 1;
            tutors.push(tutor);
          }
        } else if (isNegative) {
          score -= isTutorOverDays ? 3 : 2;
          if (!tutors.includes(tutor)) {
            tutors.push(tutor);
          }
        }
      } else {
        score--;
      }

      if (!negativeDays.includes(activity.day)) {
        score += isTutorOverDays ? 3 : 2;
      } else {
        score -= isTutorOverDays ? 3 : 2;
      }
    }
  }
  return score;
};

const checkClashing = (selectedOccurrences, isAllowExamClash) => {
  for (let i = 0; i < selectedOccurrences.length; i++) {
    for (let j = i + 1; j < selectedOccurrences.length; j++) {
      if (isClashing(selectedOccurrences[i], selectedOccurrences[j], isAllowExamClash)) {
        return true;
      }
    }
  }
  return false;
};

function getAllCombinations(courses) {
  const courseKeys = Object.keys(courses);

  function cartesianProduct(arrays) {
    return arrays.reduce(
      (acc, curr) => {
        return acc.flatMap((accItem) =>
          curr.map((currItem) => accItem.concat(currItem))
        );
      },
      [[]]
    );
  }

  const occurrencesArrays = courseKeys.map((course) => courses[course]);

  const combinations = cartesianProduct(occurrencesArrays);

  return combinations;
}

export default evaluateSchedule;
