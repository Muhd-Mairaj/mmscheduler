import { courses, hasCourse } from "../../lib/courses";

const MAX_IDS = 60;

/** Returns { [code]: occurrences[] } for every known code; unknown codes are skipped. */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const codes = (searchParams.get("query") ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  const results = Object.fromEntries(codes.filter(hasCourse).map((code) => [code, courses[code]]));

  return Response.json(results, { headers: { "Cache-Control": "public, max-age=300" } });
}
