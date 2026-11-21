import data from '../../functions/Common/courses';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  let results = {};

  for (const courseCode of query.split(",")) {
    if (courseCode) {
      results[courseCode] = getCourseById(courseCode);
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // the data only changes once a day
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function getCourseById(query) {
  if (!query) {
    return {};
  }

  return data[query];
}