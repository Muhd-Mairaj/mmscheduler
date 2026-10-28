/**
 * Turns OCR text of a UM "Registered Modules" table into module + occurrence
 * pairs. Kept framework-free so it can be unit-tested. Tolerant of typical OCR
 * slips: wrong letter case, O/0 and I/1 mix-ups, stray digits in the credit
 * column, and wrapped module names.
 */

const STATUS = /^(enrolled|registered|confirmed|pending|waitlist(ed)?|dropped|withdrawn|approved)$/i;
const OCCURRENCE = /^\d{1,3}[A-Za-z]?$/;
const CODE_SHAPE = /^([A-Z]{2,4})([0-9OIL|SB]{3,6})([A-Z]?)$/;
const DIGIT_FIX = { O: "0", I: "1", L: "1", "|": "1", S: "5", B: "8" };

/** Possible real course codes for an OCR token (as read, and with digit look-alikes fixed). */
export const codeVariants = (token) => {
  const upper = String(token).toUpperCase().replace(/[^A-Z0-9|]/g, "");
  const match = CODE_SHAPE.exec(upper);
  if (!match || !/\d/.test(match[2])) return [];
  const [, letters, digits, suffix] = match;
  const fixed = letters + [...digits].map((c) => DIGIT_FIX[c] ?? c).join("") + suffix;
  return [...new Set([upper, fixed])];
};

/** One entry per OCR line that starts with something code-shaped. */
export const extractRows = (text) => {
  const rows = [];
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    const at = tokens.slice(0, 3).findIndex((t) => codeVariants(t).length > 0);
    if (at < 0) continue;

    const rest = tokens.slice(at + 1);
    const statusAt = rest.findIndex((t) => STATUS.test(t));
    const scope = statusAt >= 0 ? rest.slice(0, statusAt) : rest;
    // right-to-left: the occurrence column sits right before the status column
    const occurrences = scope.filter((t) => OCCURRENCE.test(t)).reverse();
    rows.push({ variants: codeVariants(tokens[at]), occurrences, line });
  }
  return rows;
};

export const candidateCodes = (rows) => [...new Set(rows.flatMap((r) => r.variants))];

/**
 * @param rows        from extractRows
 * @param courseData  { [code]: occurrences[] } for the candidate codes that exist
 * @returns items: { code, name, credits, occurrence, occurrences, state }
 *   state: "ok" | "occurrence-missing" | "unknown"
 */
export const resolveRows = (rows, courseData) => {
  const items = [];
  const seen = new Set();
  for (const row of rows) {
    const code = row.variants.find((v) => courseData[v]);
    if (!code) {
      items.push({ code: row.variants[0], state: "unknown", line: row.line });
      continue;
    }
    if (seen.has(code)) continue;
    seen.add(code);

    const occurrences = courseData[code];
    const valid = new Set(occurrences.map((o) => String(o.occurence).toUpperCase()));
    const pick = row.occurrences.find((o) => valid.has(o.toUpperCase()));
    const match = pick && occurrences.find((o) => String(o.occurence).toUpperCase() === pick.toUpperCase());
    items.push({
      code,
      name: occurrences[0]?.module,
      credits: occurrences[0]?.credits,
      occurrences,
      occurrence: match?.occurence ?? null,
      readAs: row.occurrences[0] ?? null,
      state: match ? "ok" : "occurrence-missing",
    });
  }
  return items;
};
