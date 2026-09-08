import { getDb } from '@mmscheduler/db';
import { searchCourses } from '@mmscheduler/db/queries.js';

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

  if (!query) {
    return Response.json({ results: {}, total: 0, page, limit, totalPages: 0, hasMore: false });
  }

  const { results, total } = await searchCourses(getDb(), query, page, limit);
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return Response.json({ results, total, page, limit, totalPages, hasMore });
}
