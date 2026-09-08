import { getDb } from '@mmscheduler/db';
import { getCoursesByIds } from '@mmscheduler/db/queries.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('query') || '').split(',');

  const results = await getCoursesByIds(getDb(), ids);

  return Response.json(results);
}
