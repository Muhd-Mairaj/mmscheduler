/**
 * Formats a string to Title Case with support for Malaysian naming conventions
 * (A/L, A/P, S/O, D/O) and special punctuation like hyphens and dots.
 * 
 * @param {string} str - The string to format (e.g., "MOHD AL-ABIDAH A/L AHMAD")
 * @returns {string} - The formatted string (e.g., "Mohd Al-Abidah A/L Ahmad")
 */
export const toTitleCase = (str) => {
  if (!str) return "";
  const whitelist = {
    "a/l": "A/L",
    "a/p": "A/P",
    "s/o": "S/O",
    "d/o": "D/O",
  };

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // 1. Check full word whitelist
      if (whitelist[word]) return whitelist[word];

      // 2. Handle sub-punctuation (hyphens and dots)
      // This handles Al-Barrei -> Al-Barrei and T.Vanitha -> T.Vanitha
      return word
        .split(/([-.\/])/)
        .map((part, index) => {
          // If it's a separator, return as is
          if (index % 2 !== 0) return part;
          // Capitalize the part
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join("");
    })
    .join(" ");
};
