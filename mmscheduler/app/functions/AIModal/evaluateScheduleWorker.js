import evaluateSchedule from './evaluateSchedule';

onmessage = function (e) {
    const { courses, positiveTutors, negativeTutors, negativeDays, prioritizeLecturers } = e.data;
    
    // Call the evaluateSchedule function (or place your scheduling logic here)
    const generatedSchedule = evaluateSchedule(courses, positiveTutors, negativeTutors, negativeDays, prioritizeLecturers);
    
    // Send back the result
    postMessage(generatedSchedule);
  };