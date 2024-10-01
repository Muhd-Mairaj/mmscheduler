import data from '../../all_courses_updated_one_week_schedule_occ_separated.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  console.log(searchParams.get('query'));
  let results = {};

  for (const courseCode of searchParams.get('query').split(",")) {
    if (courseCode) {
      results[courseCode] = getCourseById(courseCode);
    }
  }
  console.log(results);

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCourseById(query) {
  if (!query) {
    return {};
  }

  return data[query];
}