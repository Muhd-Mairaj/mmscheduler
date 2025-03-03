import json

start_data: list = json.load(open("course_events_with_details (5).json"))

remaining_data: list = json.load(open("course_events_with_details.json"))


start_data.extend(remaining_data)

json.dump(start_data, open("course_events_with_details.json", "w"), indent=2)