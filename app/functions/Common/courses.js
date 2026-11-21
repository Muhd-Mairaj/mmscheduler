import allCourses from "../../all_courses_updated_one_week_schedule_occ_separated.json";
import { mergeCourseActivities } from "./mergeActivities";

// Merged only once and shared by the API routes, merging takes a moment
const courses = mergeCourseActivities(allCourses);

export default courses;
