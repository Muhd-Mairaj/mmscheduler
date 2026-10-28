import raw from "../all_courses_updated_one_week_schedule_occ_separated.json";
import { normalizeCourses } from "./normalize.mjs";

/** The bundled dataset, normalised once per server instance and shared by every API route. */
export const courses = normalizeCourses(raw);

export const hasCourse = (code) => Object.hasOwn(courses, code);
