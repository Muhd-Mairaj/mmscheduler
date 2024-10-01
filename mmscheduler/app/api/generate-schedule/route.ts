import JamAI from "jamaibase";
import { NextRequest, NextResponse } from "next/server";

const jamai = new JamAI({
  baseURL: process.env.baseURL!,
  apiKey: process.env.apiKey,
  projectId: process.env.projectId,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("Request body:", body);

  try {
    const data = {
      preferred_lecturers: body.preferred_lecturers,
      preferred_days_off: body.preferred_days_off,
      lecturers_more_important: body.lecturers_more_important,
      daily_preference: body.daily_preference,
      courses: body.courses,
    };

    console.log("Data being sent to JamAI:", data);

    // Step 1: Add the row
    let addRowResponse = await jamai.addRow({
      table_type: "action",
      data: [data],
      table_id: "scheduler",
      reindex: null,
      concurrent: true,
    });

    console.log("JamAI addRow response:", addRowResponse);

    // Extract the row_id from the response
    const rowId = addRowResponse.rows[0].row_id;

    // Step 2: Fetch the result using the row_id
    let resultResponse = await jamai.getRow({
      table_type: "action",
      table_id: "scheduler",
      row_id: rowId,
    });

    console.log("JamAI getRow response:", resultResponse);

    // The LLM answer should be in the resultResponse
    // You may need to adjust this depending on the exact structure of the response
    const llmAnswer = resultResponse.suggested_schedule;

    console.log("LLM answer:", llmAnswer);

    return NextResponse.json({ llmAnswer });
  } catch (error) {
    console.error("Error from JamAI:", error);
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      { message: "Internal server error", error: errorMessage },
      { status: 500 }
    );
  }
}
