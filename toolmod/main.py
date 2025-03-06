import argparse
import json
import os
import pprint
import copy

import openpyxl
from custom_sheets import MayaSheet
from custom_sheets.MayaSheet import get_sheet as get_maya_sheet

# data = json.load(open("course_events_with_details.json"))

# for course in data:
#     if not course["details"]:
#         print(f"Course {course["id"]} has no details", file=open("errors.txt", "a"))
#         continue

#     if course["details"].get("In Use? (Y/N)", "") == "Y" and not course.get("events"):
#         print(f"{course["details"].get("Module Code")} in use but has no events")

#     if course["details"].get("In Use? (Y/N)", "") == "N" and course.get("events"):
#         print(f"{course["details"].get("Module Code")} not in use but has events")

parser = argparse.ArgumentParser(description="A script that allows restructuring parsed data to required format")
parser.add_argument("output", help="The path to the output json file")
parser.add_argument("--maya", action="store", help="Specify the path to the maya sheet file/dir")
parser.add_argument("--finalise", action="store_true", help="Specify that the data should be finalised to final format")
# parser.add_argument("--path", help="The path to the Maya sheet file if --maya is specified")
args = parser.parse_args()

if args.maya and args.finalise:
    parser.error("--finalise cannot be used with --maya")

mapping = {
    "LEC": "lecture",
    "EXAM": "exam",
    "TUT": "tutorial",
    "LAB": "lab",
    "ONL": "online",
    "REPROJECT": "reproject",
    "SEM": "seminar",
    "PRA": "practical",
}

def main():
    timetable_data = json.load(open("timetable_data.json"))

    updated_data = {}
    for course in timetable_data:
        # these are details (unfortunately) repeated for each occ
        updated_course_base_details = {
            "module": course["moduleName"],
            "course_id": course["moduleCode"],
            "credits": course["credit"],
            "yearPeriod": course["yearPeriod"],
            "overallTargetStudent": course["overallTargetStudent"],
            "level": course["level"],
            "faculty": course["faculty"],
            "continuousAssessmentWeightage": course["continuousAssessmentWeightage"],
            "examDuration": course["examDuration"],
            "levelCode": course["levelCode"],
            # "activities": []
        }


        updated_data[course["moduleCode"]] = {}     # moduleCode: {occ: occ_details}
        occurrences = {}

        for type, details_list in course["activities"].items():       # activities = {type: [details]}
            for details in details_list:
                if "occurrences" not in details:
                    print(f"{course["moduleCode"]} activity {type} has no occurrences", file=open("errors.txt", "a"))
                    continue

                for occ in details["occurrences"]:
                    occurrences.setdefault(occ, updated_course_base_details.copy())
                    occurrences[occ]["occurence"] = occ
                    occurrences[occ].setdefault("activities", [])
                    activity = {
                        "title": mapping[type],
                        "day": details["dayOfWeek"],
                        "room": details["room"],
                        "begin_time": details["startTime"],
                        "end_time": details["endTime"],
                        "tutor": f"{details["lecturer"]["title"] if details["lecturer"].get("title") else ""} {details["lecturer"]["fullName"] if details.get("lecturer") else None}"
                    }

                    if mapping[type] == "exam":
                        activity["start_date"] = details["startDate"]
                        activity["end_date"] = details["endDate"]

                    occurrences[occ]["activities"].append(activity)

        updated_data[course["moduleCode"]] = occurrences

    ## update data from maya
    files = None
    if args.maya:
        if os.path.isdir(args.maya):
            files = [os.path.join(args.maya, f) for f in os.listdir(args.maya) if f.endswith(".xlsx")]
        else:
            if not args.maya.endswith(".xlsx"):
                print("Invalid file format. Must be an xlsx file. Skipping maya update")
            else:
                files = [args.maya]

    if files:
        for file in files:
            workbook = openpyxl.load_workbook(file, read_only=True)
            sheet = get_maya_sheet(workbook.active)

            updated_data.upd = update_data_from_maya(sheet, updated_data)

    json.dump(updated_data, open(args.output, "w"), indent=2)



def update_data_from_maya(sheet: MayaSheet.MyReadOnlyWorksheet | MayaSheet.Worksheet, data: dict):
    current_module_code = None
    current_module_name = None

    current_occurence = None
    current_mav_name = None

    for row in sheet.iter_rows(min_row=sheet.header_row+1, max_row=sheet.end_row, values_only=True):
        # print(row)
        module_code = row[sheet._module_code_column - 1]
        module_name = row[sheet._module_name_column - 1]
        occurrence = row[sheet._occurrence_column - 1]
        mav_name = row[sheet._mav_name_column - 1]
        # activity = row[sheet._activity_column - 1]
        time_details = row[sheet._time_details_column - 1]

        day, begin_time, end_time = parse_time_details(time_details)

        tutor = row[sheet._tutor_column - 1]
        room = row[sheet._room_column - 1]

        if not current_module_code or (module_code):
            current_module_code = module_code
            current_module_name = module_name
            module_code = None   # reset variable for next iterations
            module_name = None   # reset variable for next iterations

        if not current_occurence or (occurrence):
            current_occurence = occurrence
            current_mav_name = mav_name
            occurrence = None   # reset variable for next iterations
            mav_name = None   # reset variable for next iterations

        if current_module_code not in data:
            print(f"Module '{current_module_code} {
                  current_module_name}' not in data.")
            continue

        if current_occurence not in data[current_module_code]:
            print(f"Occ {current_occurence} not found for module '{
                  current_module_code} {current_module_name}'")
            continue

        # update module name and mav_name
        data[current_module_code][current_occurence].setdefault("mav_name", data[current_module_code][current_occurence]["module"])
        data[current_module_code][current_occurence]["module"] = current_module_name.strip()

        if not (day and begin_time and end_time):
            print(f"Time details not found for Occ {current_occurence} of module '{
                  current_module_code} {current_module_name}'")
            continue

        for activity in data[current_module_code][current_occurence].get("activities", []):
            if activity["day"].lower() == day.lower() and \
                activity["begin_time"] == begin_time and \
                    activity["end_time"] == end_time:
                # this will update original because its a reference
                activity["tutor"] = tutor

    return data


def parse_time_details(time_details: str):
    if not time_details:
        return (None, None, None)

    day, time = time_details.split("\n")
    begin_time, _, end_time, duration = time.split(" ")
    return day, begin_time, end_time


if __name__ == "__main__":
    main()

# timetable_data
{
    "moduleName": "SOFTWARE REQUIREMENTS ENGINEERING",
    "moduleCode": "WIF2002",
    "credit": 3,
    "yearPeriod": "2024/S2",
    "overallTargetStudent": 120,
    "level": "BACHELOR",
    "faculty": "FACULTY OF COMPUTER SCIENCE AND INFORMATION TECHNOLOGY",
    "continuousAssessmentWeightage": "50~50",
    "examDuration": 7200,
    "levelCode": 3,
    "activities": {
        "LEC": [
            {
                "dayOfWeek": "Tuesday",
                "startTime": "08:00",
                "endTime": "10:00",
                "room": "DK2",
                "occurrences": [
                  "1",
                  "2",
                  "3"
                ]
            }
        ],
        "EXAM": [
            {
                "dayOfWeek": "Tuesday",
                "startTime": "08:30",
                "endTime": "10:30",
                "room": "EXAM_HOLD_G",
                "startDate": "08/07/2025",
                "endDate": "08/07/2025",
                "activityTypeExam": "Physical",
                "occurrences": [
                    "1",
                    "2",
                    "3"
                ]
            }
        ],
        "TUT": [
            {
                "dayOfWeek": "Wednesday",
                "startTime": "08:00",
                "endTime": "09:00",
                "room": "BK2",
                "occurrences": [
                    "1"
                ]
            },
            {
                "dayOfWeek": "Wednesday",
                "startTime": "10:00",
                "endTime": "11:00",
                "room": "BK2",
                "occurrences": [
                    "2"
                ]
            },
            {
                "dayOfWeek": "Wednesday",
                "startTime": "11:00",
                "endTime": "12:00",
                "room": "BK2",
                "occurrences": [
                    "3"
                ]
            }
        ],
        "LAB": [],
        "ONL": [],
        "REPROJECT": [],
        "SEM": [],
        "PRA": []
    }
}
