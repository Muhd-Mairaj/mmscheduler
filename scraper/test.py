import json

# output_data = json.load(open('output.json'))
# tracker_data = json.load(open('tracker.json'))

# for course in tracker_data:
#     if course in output_data:
#         english_module = tracker_data[course].values().__iter__().__next__().get("module")
#         print(f"{course} is module {english_module}")

#         for occ in output_data[course]:
#             output_data[course][occ]["module"] = english_module

# json.dump(output_data, open('output.json', 'w'), indent=2)


# change credits to int
file_to_change = "output_copy.json"
output_data = json.load(open(file_to_change))

for course_data in output_data.values():
    for occ in course_data.values():
        occ["credits"] = int(occ["credits"])


json.dump(output_data, open(file_to_change, "w"), indent=2)