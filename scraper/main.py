import json
import sys

import openpyxl
from custom_sheets import MayaSheet as MayaSheet
from custom_sheets import TimeEditSheet as TimeEditSheet
from custom_sheets.MayaSheet import get_sheet as get_maya_sheet
from custom_sheets.TimeEditSheet import get_sheet as get_time_edit_sheet


choice = ""

def main(args):
    # open timeedit excel file
    time_edit_excel_file_path = args[0]
    workbook = openpyxl.load_workbook(
        time_edit_excel_file_path, read_only=True)
    sheet = get_time_edit_sheet(workbook.active)

    # read data
    tracking_data = read_data(sheet)

    # open maya excel file
    maya_excel_file_path = args[1]
    workbook = openpyxl.load_workbook(maya_excel_file_path, read_only=True)
    sheet = get_maya_sheet(workbook.active)

    # update data
    update_data_from_maya(tracking_data, sheet)

    # store data to json file
    data_occ_separated = convert_tracking_data_to_output_format(tracking_data)
    print(len(data_occ_separated))
    json_file_path_occ_separated = args[2]
    json.dump(data_occ_separated, open(
        json_file_path_occ_separated, "w"), indent=2)


def read_data(sheet: TimeEditSheet.MyReadOnlyWorksheet | TimeEditSheet.Worksheet):
    global choice

    def get_row_item(row, index):
        try:
            return row[index]
        except IndexError:
            return None

    choice = input("\nInput path of .json with pre-existing data (leave empty if none): ")
    if choice:
        tracker = json.load(open(choice))
    else:
        tracker = {}

    for row in sheet.iter_rows(min_row=sheet.header_row+1, max_row=sheet.end_row, values_only=True):
        print(row)
        module_offering = row[sheet._module_offering_column - 1]
        code, _, occurences = parse_module_offering(module_offering)

        module = row[sheet._module_column - 1]
        activity = "tutorial" if row[sheet._activity_column -
                                     1].lower() == "tutorial" else "lecture"
        day = row[sheet._day_column - 1]
        begin_time = row[sheet._begin_column - 1]
        end_time = row[sheet._end_column - 1]

        room = get_row_item(row, sheet._room_column - 1)

        for occ in occurences:
            if code not in tracker:
                tracker[code] = {}

            # if this occ for this code is not found before, start tracking it
            if occ not in tracker[code]:
                tracker[code][occ] = {
                    "module": module,
                    "course_id": code,
                    "occurence": occ,
                    # activity.lower(): {
                    #     "day": day,
                    #     "room": room,
                    #     "begin_time": begin_time,
                    #     "end_time": end_time,
                    # }
                }

            # update it for each activity
            # use set to not effect the original data
            tracker: dict[str, list[dict[str, str]]]
            tracker[code][occ][activity].setdefault("day", day)
            tracker[code][occ][activity].setdefault("room", room)
            tracker[code][occ][activity].setdefault("begin_time", begin_time)
            tracker[code][occ][activity].setdefault("end_time", end_time)
            # tracker[code][occ][activity] = {
            #     "day": day,
            #     "room": room,
            #     "begin_time": begin_time,
            #     "end_time": end_time,
            # }

    if choice:
        json.dump(tracker, open(choice, "w"), indent=2)
    return tracker


def update_data_from_maya(tracker_data, sheet: MayaSheet.MyReadOnlyWorksheet | MayaSheet.Worksheet):
    global choice

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
        activity = row[sheet._activity_column - 1]
        time_details = row[sheet._time_details_column - 1]
        # print(f"{current_module_code} {
        #   current_module_name} Occ {current_occurence}")
        # print(f"{repr(time_details)}")

        day, begin_time, end_time = parse_time_details(time_details)
        # print(f"{day=}")
        # print(f"{begin_time=}")
        # print(f"{end_time=}")
        # print()

        tutor = row[sheet._tutor_column - 1]
        room = row[sheet._room_column - 1]

        if not current_module_code or (module_code):
            current_module_code = module_code
            current_module_name = module_name
            module_code = None   # some random string that wont match the next find
            module_name = None   # some random string that wont match the next find

        if not current_occurence or (occurrence):
            current_occurence = occurrence
            current_mav_name = mav_name
            occurrence = None   # some random string that wont match the next find
            mav_name = None   # some random string that wont match the next find

        if current_module_code not in tracker_data:
            print(f"Module '{current_module_code} {
                  current_module_name}' not in data.")
            continue

        if current_occurence not in tracker_data[current_module_code]:
            print(f"Occ {current_occurence} not found for module '{
                  current_module_code} {current_module_name}'")
            continue

        if not (day and begin_time and end_time):
            print(f"Time details not found for Occ {current_occurence} of module '{
                  current_module_code} {current_module_name}'")

        # update module name and mav_name
        tracker_data[current_module_code][current_occurence]["module"] = current_module_name
        tracker_data[current_module_code][current_occurence]["mav_name"] = current_mav_name

        # update lecture details if present
        if "lecture" in tracker_data[current_module_code][current_occurence]:
            lecture_info = tracker_data[current_module_code][current_occurence]["lecture"]

            # if the day and time matches lecture day and time, update details
            if (day and begin_time and end_time) and (
                lecture_info["day"].lower() == day.lower(
                ) and lecture_info["begin_time"] == begin_time and lecture_info["end_time"] == end_time
            ):
                # this will update original because its a reference
                lecture_info["tutor"] = tutor

        # update tutorial details if present
        if "tutorial" in tracker_data[current_module_code][current_occurence]:
            tutorial_info = tracker_data[current_module_code][current_occurence]["tutorial"]

            # if the day and time matches tutorial day and time, update details
            if (day and begin_time and end_time) and (
                tutorial_info["day"].lower() == day.lower(
                ) and tutorial_info["begin_time"] == begin_time and tutorial_info["end_time"] == end_time
            ):
                # this will update original because its a reference
                tutorial_info["tutor"] = tutor

    if choice:
        json.dump(tracker_data, open(choice, "w"), indent=2)


def parse_time_details(time_details: str):
    if not time_details:
        return (None, None, None)

    day, time = time_details.split("\n")
    begin_time, _, end_time, duration = time.split(" ")
    return day, begin_time, end_time


def parse_module_offering(module_offering: str) -> tuple:
    offerings = module_offering.split(", ")
    if len(offerings) != 1:
        code = offerings[0].split("/")[0]
        period = offerings[0].split("/")[-2]
        occs = [offering.split("/")[-1] for offering in offerings]
        return code, period, occs

    parsed = module_offering.split("/")
    return parsed[0], parsed[-2], [parsed[-1]]


def convert_tracking_data_to_output_format(tracking_data):
    data = {code: sorted(list(occ.values()), key=lambda x: x["occurence"].rjust(
        2, " ")) for code, occ in tracking_data.items()}

    data = {key: data[key] for key in sorted(data.keys())}
    return data


if __name__ == "__main__":
    main(sys.argv[1:])
