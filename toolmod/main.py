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
args = parser.parse_args()

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
        occurrences = {}                            # occurrences = {occ: occ_details}

        for type, details_list in course["activities"].items():       # activities = {type: [details]}
            for details in details_list:
                if "occurrences" not in details:
                    print(f"{course["moduleCode"]} activity {type} has no occurrences", file=open("errors.txt", "a"))
                    print(f"{course['moduleCode'] = }, {type = } {details = }")
                    continue

                for occ in set(details["occurrences"]):
                    occurrences.setdefault(occ, updated_course_base_details.copy())
                    occurrences[occ]["occurence"] = occ
                    occurrences[occ].setdefault("activities", [])
                    activity = {
                        "title": mapping[type],
                        "day": details["dayOfWeek"],
                        "room": details["room"],
                        "begin_time": details["startTime"],
                        "end_time": details["endTime"],
                    }
                    if details.get("lecturer"):
                        activity["tutor"] = f"{details["lecturer"].get("title", "")} {details["lecturer"].get("fullName", "")}"

                    if mapping[type] == "exam":
                        activity["start_date"] = details["startDate"]
                        activity["end_date"] = details["endDate"]

                    occurrences[occ]["activities"].append(activity)

        updated_data[course["moduleCode"]] = occurrences

    updated_data = convert_tracking_data_to_output_format(updated_data)

    json.dump(updated_data, open(args.output, "w"), indent=2)


def convert_tracking_data_to_output_format(tracking_data):
    data = {code: sorted(list(occ.values()), key=lambda x: x["occurence"].rjust(
        2, " ")) for code, occ in tracking_data.items()}

    data = {key: data[key] for key in sorted(data.keys())}
    return data


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
