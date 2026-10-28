import { courses } from "../../lib/courses";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_QUERY_LENGTH = 100;
const MAX_WORDS = 8;

// Pre-computed once per server instance: lowercase code + module name.
const index = Object.entries(courses).map(([code, occurrences]) => ({
  code,
  occurrences,
  codeLower: code.toLowerCase(),
  nameLower: (occurrences[0]?.module ?? "").toLowerCase(),
}));

const json = (body) => Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });

const toInt = (value, fallback) => parseInt(value, 10) || fallback;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim().toLowerCase().slice(0, MAX_QUERY_LENGTH);
  const page = Math.max(1, toInt(searchParams.get("page"), 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, toInt(searchParams.get("limit"), DEFAULT_LIMIT)));

  if (!query) {
    return json({ results: {}, total: 0, page, limit, totalPages: 0, hasMore: false });
  }

  // Every whitespace-separated word must appear in the code or the name.
  const words = query.split(/\s+/).slice(0, MAX_WORDS);
  const rank = (c) => (c.codeLower.startsWith(query) ? 0 : c.nameLower.startsWith(query) ? 1 : 2);
  const matches = index
    .filter((c) => words.every((w) => c.codeLower.includes(w) || c.nameLower.includes(w)))
    // code prefix matches first, then name prefix, then alphabetical by code
    .sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code));

  const total = matches.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const results = Object.fromEntries(matches.slice(start, start + limit).map((c) => [c.code, c.occurrences]));

  return json({ results, total, page, limit, totalPages, hasMore: page < totalPages });
}
