export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmscheduler.netlify.app";
export const SITE_NAME = "MMScheduler";
export const SEMESTER = "Semester 1, 2026/2027";
export const SEMESTER_LABEL = "Sem 1, 2026/27";
export const SITE_TITLE = "MMScheduler – UM Timetable Planner for Universiti Malaya Students";
export const SITE_DESCRIPTION =
  `Free UM timetable planner. Search Universiti Malaya modules, compare occurrences, avoid class and exam clashes, auto-schedule around your lecturers and days off, and save your ${SEMESTER} timetable as an image.`;

export const KEYWORDS = [
  "UM timetable",
  "UM timetable planner",
  "Universiti Malaya timetable",
  "University of Malaya timetable",
  "UM course registration",
  "UM occurrence planner",
  "UM class schedule maker",
  "UM timetable clash checker",
  "UM exam timetable",
  `UM ${SEMESTER.toLowerCase()} timetable`,
  "MMScheduler",
  "timetable generator Malaysia",
  "UM auto schedule",
];

export const FAQ = [
  {
    q: "What is MMScheduler?",
    a: "MMScheduler is a free, unofficial timetable planner for University of Malaya (Universiti Malaya, UM) students. It lets you compare every occurrence of your modules and build a clash-free weekly timetable before you register.",
  },
  {
    q: "How do I make my UM timetable?",
    a: "Search for each module by code or name, add it, then pick an occurrence. Occurrences that clash with your timetable are greyed out automatically. You can also paste a screenshot of your Registered Modules table and the planner adds the modules and occurrences for you.",
  },
  {
    q: "Can it choose my occurrences automatically?",
    a: "Yes. Auto-schedule finds the best clash-free combination using your preferred or avoided lecturers, days off, earliest start, latest finish and a fewer-campus-days option. It runs in your browser.",
  },
  {
    q: "Does it check exam clashes?",
    a: "Yes. Exam sessions on the same date that overlap are treated as a clash, and exams are listed separately. You can switch on “Allow exam clashes” if you want to ignore them.",
  },
  {
    q: "Is my data sent anywhere?",
    a: "No account is needed. Your plan is stored only in your browser, screenshots are read on your own device, and nothing is uploaded.",
  },
  {
    q: "Is MMScheduler official?",
    a: "No. It is an independent student project and is not affiliated with Universiti Malaya. Timetables can change, so always confirm your final schedule in the official UM systems.",
  },
];

export const jsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "MYR" },
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
    about: { "@type": "CollegeOrUniversity", name: "Universiti Malaya", alternateName: "University of Malaya" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];
