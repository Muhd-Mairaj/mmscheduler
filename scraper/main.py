import argparse
import json
import os

import openpyxl
from custom_sheets import MayaSheet as MayaSheet
from custom_sheets import TimeEditSheet as TimeEditSheet
from custom_sheets.MayaSheet import get_sheet as get_maya_sheet
from custom_sheets.TimeEditSheet import get_sheet as get_time_edit_sheet


def main():
    parser = argparse.ArgumentParser(
        description="A script that helps scraping different aspects of the module offerings")
    parser.add_argument("mode", choices=[
                        "timeedit", "maya", "finalise"], help="The mode to run ('timeedit' or 'maya')")
    parser.add_argument(
        "path", help="The path to the excel file or the directory containing the excel files to be parsed")
    parser.add_argument("--output", required=True,
                        help="The path to the output json file")
    args = parser.parse_args()


    if args.mode != "finalise" and os.path.isdir(args.path):
        files = [os.path.join(args.path, file) for file in os.listdir(
            args.path) if file.endswith(".xlsx")]
    elif args.path.endswith(".xlsx"):
        files = [args.path]

    # Perform tasks based on the mode
    match args.mode:
        case "timeedit":
            for file in files:
                print(file)
                workbook = openpyxl.load_workbook(file, read_only=True)
                sheet = get_time_edit_sheet(workbook.active)
                read_data(sheet, args.output)
        case "maya":
            for file in files:
                print(file)
                workbook = openpyxl.load_workbook(file, read_only=True)
                sheet = get_maya_sheet(workbook.active)
                update_data_from_maya(sheet, args.output)
        case "finalise":
            try:
                # try to read from json file
                tracker = json.load(open(args.path))
            except (FileNotFoundError, json.decoder.JSONDecodeError):
                raise RuntimeError("No data found to finalise")

            data = convert_tracking_data_to_output_format(tracker)
            json.dump(data, open(args.output, "w"), indent=2)
        case _:
            print("Invalid mode")
            raise ValueError("Invalid mode")


def read_data(sheet: TimeEditSheet.MyReadOnlyWorksheet | TimeEditSheet.Worksheet, output: str):
    def _get_row_item(row, index):
        try:
            return row[index]
        except IndexError:
            return None

    try:
        # try to read from json file
        tracker = json.load(open(output))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        tracker = {}

    try:
        english_name_map = json.load(open("tracker copy.json"))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        english_name_map = None

    print(f"{tracker=}")

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

        room = _get_row_item(row, sheet._room_column - 1)

        for occ in occurences:
            tracker.setdefault(code, {})
            # if code not in tracker:
            #     tracker[code] = {}

            # if this occ for this code is not found before, start tracking it
            module_name = english_name_map[code][occ].get("module") if english_name_map else module
            print(f"{module_name=}")
            tracker[code].setdefault(occ, {
                "module": module_name or module,
                "course_id": code,
                "occurence": occ,
            })
            # if occ not in tracker[code]:
            #     tracker[code][occ] = {
            #         "module": module,
            #         "course_id": code,
            #         "occurence": occ,
            #     }

            tracker[code][occ].setdefault(activity, {})
            if activity not in tracker[code][occ]:
                tracker[code][occ][activity] = {}

            # use set to not effect the overwrite existing data
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

    json.dump(tracker, open(output, "w"), indent=2)


def update_data_from_maya(sheet: MayaSheet.MyReadOnlyWorksheet | MayaSheet.Worksheet, output: str):
    try:
        # try to read from json file
        tracker = json.load(open(output))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        tracker = {}

    print(f"{tracker=}")

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

        if current_module_code not in tracker:
            print(f"Module '{current_module_code} {
                  current_module_name}' not in data.")
            continue

        if current_occurence not in tracker[current_module_code]:
            print(f"Occ {current_occurence} not found for module '{
                  current_module_code} {current_module_name}'")
            continue

        # update module name and mav_name
        tracker[current_module_code][current_occurence]["module"] = current_module_name
        tracker[current_module_code][current_occurence]["mav_name"] = current_mav_name

        if not (day and begin_time and end_time):
            print(f"Time details not found for Occ {current_occurence} of module '{
                  current_module_code} {current_module_name}'")
            continue

        # update lecture details if present
        if lecture_info := tracker[current_module_code][current_occurence].get("lecture"):
            if lecture_info["day"].lower() == day.lower() and \
                lecture_info["begin_time"] == begin_time and \
                    lecture_info["end_time"] == end_time:
                # this will update original because its a reference
                lecture_info["tutor"] = tutor

        # update tutorial details if present
        if tutorial_info := tracker[current_module_code][current_occurence].get("tutorial"):
            if tutorial_info["day"].lower() == day.lower() and \
                tutorial_info["begin_time"] == begin_time and \
                    tutorial_info["end_time"] == end_time:
                # this will update original because its a reference
                tutorial_info["tutor"] = tutor

    json.dump(tracker, open(output, "w"), indent=2)


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
    main()
