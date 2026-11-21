// Words that end a row in the "Registered Modules" table
const STATUS_WORDS = ["enrolled", "registered", "confirmed", "pending", "waitlisted", "dropped"];

// OCR often mixes up look-alike characters in the number part of a code (O and 0, I and 1...)
const DIGIT_LOOKALIKES = { O: "0", I: "1", L: "1", S: "5", B: "8" };

// Returns the module codes a word could be, e.g. "KiB2O10" -> ["KIB2O10", "KIB2010"]
const getCodeVariants = (word) => {
  const match = /^([A-Z]{2,4})([0-9OILSB]{3,6})([A-Z]?)$/.exec(word.toUpperCase());
  if (!match || !/\d/.test(match[2])) {
    return [];
  }

  const [code, letters, digits, suffix] = match;
  const fixedDigits = digits
    .split("")
    .map((char) => DIGIT_LOOKALIKES[char] || char)
    .join("");
  // a letter can also be read twice (KIIB instead of KIB)
  const singleLetters = letters.replace(/(.)\1/g, "$1");

  return [
    ...new Set([
      code,
      letters + fixedDigits + suffix,
      singleLetters + fixedDigits + suffix,
    ]),
  ];
};

// Goes through the text OCR read from the table and finds one row per module code,
// together with the numbers that could be its occurrence
export const parseEnrollment = (text) => {
  const rows = [];

  text.split("\n").forEach((line) => {
    const words = line.trim().split(/\s+/);

    // the code is the first thing in a row, rows without one (wrapped module names) are skipped
    const codeIndex = words.findIndex(
      (word, index) => index < 3 && getCodeVariants(word).length > 0
    );
    if (codeIndex === -1) {
      return;
    }

    const rest = words.slice(codeIndex + 1);
    const statusIndex = rest.findIndex((word) =>
      STATUS_WORDS.includes(word.toLowerCase())
    );
    const beforeStatus = statusIndex === -1 ? rest : rest.slice(0, statusIndex);

    // the occurrence is the last number before the status, the credit column comes before it
    const occurrences = beforeStatus
      .filter((word) => /^\d{1,3}[A-Za-z]?$/.test(word))
      .reverse();

    rows.push({ codes: getCodeVariants(words[codeIndex]), occurrences });
  });

  return rows;
};

// All the codes worth looking up in the timetable data
export const getCandidateCodes = (rows) => {
  return [...new Set(rows.flatMap((row) => row.codes))];
};

// Matches the parsed rows with the real courses ({ code: occurrences[] })
export const matchEnrollment = (rows, courses) => {
  const found = [];
  const notFound = [];

  rows.forEach(({ codes, occurrences }) => {
    const code = codes.find((possibleCode) => courses[possibleCode]);

    if (!code) {
      notFound.push(codes[0]);
      return;
    }

    // same module read twice
    if (found.some((module) => module.code === code)) {
      return;
    }

    const courseOccurrences = courses[code];
    let occurrence = null;
    for (const number of occurrences) {
      occurrence = courseOccurrences.find(
        (item) => item.occurence.toLowerCase() === number.toLowerCase()
      );
      if (occurrence) {
        break;
      }
    }

    found.push({
      code,
      name: courseOccurrences[0].module,
      occurrences: courseOccurrences,
      occurrence: occurrence || null,
    });
  });

  return { found, notFound };
};
