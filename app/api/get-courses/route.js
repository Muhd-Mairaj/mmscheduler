import data from '../../all_courses_updated_one_week_schedule_occ_separated.json';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit'), 10) || DEFAULT_LIMIT)
  );

  const { results, total } = getCourses(query, page, limit);
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return new Response(
    JSON.stringify({ results, total, page, limit, totalPages, hasMore }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function getCourses(query, page, limit) {
  if (!query) {
    return { results: {}, total: 0 };
  }

  const lowercaseQuery = query.toLowerCase();

  const matchedEntries = Object.entries(data).filter(([key, value]) => {
    const courseId = key.toLowerCase();
    const moduleName = value[0]?.module?.toLowerCase() || '';
    return courseId.includes(lowercaseQuery) || moduleName.includes(lowercaseQuery);
  });

  const total = matchedEntries.length;
  const start = (page - 1) * limit;
  const results = Object.fromEntries(matchedEntries.slice(start, start + limit));

  return { results, total };
}
