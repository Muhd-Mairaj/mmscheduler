import data from '../../all_courses_updated_one_week_schedule_occ_separated.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const results = getCourse(searchParams.get('query'));

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCourse(query) {
  if (!query) {
    return {};
  }

  const lowercaseQuery = query.toLowerCase();

  const filteredData = Object.fromEntries(
    Object.entries(data)
      .filter(([key, value]) => {
        const courseId = key.toLowerCase();
        const moduleName = value[0]?.module?.toLowerCase() || '';
        return courseId.includes(lowercaseQuery) || moduleName.includes(lowercaseQuery);
      })
      .slice(0, 10)
  );

  // console.log(filteredData);
  return filteredData;
}