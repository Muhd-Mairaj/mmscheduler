// Pure parsing: raw TimeEdit downloads -> normalized DB rows in ONE pass.
//
// This replaces the old two-step chain (steps/clean.mjs + steps/transform.py
// with timetable_data.json / app_output.json files in between). The cleaning
// rules are unchanged (same filters, same tutor formatting); the only
// difference is the output: { courses, occurrences, activities } row arrays
// ready for lib/store.mjs, with activity titles already in their final
// app-facing form (lecture/tutorial/...). No intermediate files, no second
// mapping layer.
export const ACTIVITY_TITLE_MAP = {
  LEC: 'lecture',
  EXAM: 'exam',
  TUT: 'tutorial',
  LAB: 'lab',
  ONL: 'online',
  REPROJECT: 'reproject',
  SEM: 'seminar',
  PRA: 'practical',
};

function parseNumber(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getDayOfWeek(dateString) {
  const parts = dateString.split('/');
  const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}

function examTypeLabel(value) {
  if (value === 'Fizikal') return 'Physical';
  if (value === 'Atas Talian') return 'Online';
  return value;
}

export function parseRawToRows(courseRaw, lecturerRaw) {
  const lecturerMap = new Map();
  for (const lecturer of lecturerRaw) {
    if (lecturer.details && lecturer.details.Code) {
      lecturerMap.set(lecturer.details.Code, lecturer.details);
    }
  }

  // The set of activity types to keep is detected dynamically, as before.
  const activitiesToInclude = new Set();
  for (const module of courseRaw) {
    if (!module.events || !Array.isArray(module.events)) continue;
    for (const event of module.events) {
      if (event.html_details && event.html_details.Activity) {
        activitiesToInclude.add(event.html_details.Activity);
      }
      if (
        event.html_details &&
        event.html_details['Activity Type (exam)'] !== undefined &&
        event.html_details['Exam Time Slot'] !== undefined
      ) {
        activitiesToInclude.add('EXAM');
      }
    }
  }

  const coursesById = new Map(); // courseId -> course row
  const seenDetails = new Set(); // JSON dedup key, same role as clean.mjs's Set
  const occurrences = []; // { courseId, occurrenceNo }
  const occurrenceSeen = new Set();
  const activities = []; // { courseId, occurrenceNo, ... } (occurrenceId resolved in store.mjs)

  for (const module of courseRaw) {
    if (!module.details || !module.events || !Array.isArray(module.events)) continue;
    const moduleCode = module.details['Module Code'] ?? module.idOnly ?? 'UNKNOWN_MODULE_CODE';

    if (!coursesById.has(moduleCode)) {
      coursesById.set(moduleCode, {
        courseId: moduleCode,
        module: module.details['English Description'] ?? null,
        credits: parseNumber(module.details['Credit']),
        yearPeriod: module.details['Year + Period'] ?? null,
        overallTargetStudent: parseNumber(module.details['Overall Target Student']),
        level: module.details['Level Description'] ?? null,
        faculty: module.details['Faculty Description'] ?? null,
        continuousAssessmentWeightage: module.details['Weightage(%)-Continuous Assess'] ?? null,
        examDuration: parseNumber(module.details['Exam Duration (Length)']),
        levelCode: parseNumber(module.details['Level (LEV) Code']),
      });
    }

    for (const event of module.events) {
      if (!event.html_details || !event.columns || !Array.isArray(event.columns)) continue;

      let activityType = event.html_details.Activity;
      if (
        event.html_details['Activity Type (exam)'] !== undefined &&
        event.html_details['Exam Time Slot'] !== undefined
      ) {
        activityType = 'EXAM';
      }

      let room = event.html_details.Room ?? null;
      if (room && room[0] === module.details['Faculty']) {
        room = room.substring(1);
      }

      const dayOfWeek = event.startdate ? getDayOfWeek(event.startdate) : null;
      const startTime = event.starttime ?? null;
      const endTime = event.endtime ?? null;

      if (!activitiesToInclude.has(activityType) || !dayOfWeek || !startTime || !endTime || !room) {
        continue;
      }

      const occurrencesList = [];
      const prefix = `${moduleCode}/`;
      for (const col of event.columns.join(',').split(',').map((c) => c.trim())) {
        if (col.startsWith(prefix)) {
          const occ = col.split('/').pop();
          if (occ) occurrencesList.push(occ);
        }
      }
      if (occurrencesList.length === 0) continue; // old transform skipped these with a warning
      occurrencesList.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      let tutor = null;
      const lecturerId = event.html_details.Lecturer ?? null;
      if (lecturerId && lecturerMap.has(lecturerId)) {
        const d = lecturerMap.get(lecturerId);
        tutor = `${d.Title ?? ''} ${d['Full Name'] ?? ''}`;
      }

      // Keep the old exam-type rename for parity even though the app only
      // stores start/end dates (see below).
      let activityTypeExam = null;
      let startDate = null;
      let endDate = null;
      if (activityType === 'EXAM') {
        startDate = event.startdate ?? null;
        endDate = event.enddate ?? null;
        activityTypeExam = examTypeLabel(event.html_details['Activity Type (exam)'] ?? null);
      }

      const detail = {
        title: ACTIVITY_TITLE_MAP[activityType] ?? String(activityType).toLowerCase(),
        day: dayOfWeek,
        room,
        beginTime: startTime,
        endTime: endTime,
        tutor,
        startDate,
        endDate,
        activityTypeExam,
      };
      const dedupKey = `${moduleCode}\0${activityType}\0${JSON.stringify(detail)}`;
      if (seenDetails.has(dedupKey)) continue;
      seenDetails.add(dedupKey);

      for (const occ of new Set(occurrencesList)) {
        const occKey = `${moduleCode}\0${occ}`;
        if (!occurrenceSeen.has(occKey)) {
          occurrenceSeen.add(occKey);
          occurrences.push({ courseId: moduleCode, occurrenceNo: occ });
        }
        activities.push({
          courseId: moduleCode,
          occurrenceNo: occ,
          title: detail.title,
          day: detail.day,
          room: detail.room,
          beginTime: detail.beginTime,
          endTime: detail.endTime,
          tutor: detail.tutor,
          startDate: detail.startDate,
          endDate: detail.endDate,
        });
      }
    }
  }

  // Drop courses that ended up with no occurrences (same as the old
  // "filter modules with no activities" step) and sort deterministically.
  const kept = new Set(occurrences.map((o) => o.courseId));
  const courses = [...coursesById.values()]
    .filter((c) => kept.has(c.courseId))
    .sort((a, b) => (a.courseId < b.courseId ? -1 : 1));
  occurrences.sort((a, b) =>
    a.courseId !== b.courseId
      ? a.courseId < b.courseId
        ? -1
        : 1
      : String(a.occurrenceNo).padStart(2, ' ') < String(b.occurrenceNo).padStart(2, ' ')
        ? -1
        : 1,
  );

  return { courses, occurrences, activities };
}
