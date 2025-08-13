import argparse
import json
import os

import openpyxl
from custom_sheets import MayaSheet as MayaSheet
from custom_sheets import TimeEditSheet as TimeEditSheet
from custom_sheets.MayaSheet import get_sheet as get_maya_sheet
from custom_sheets.TimeEditSheet import get_sheet as get_time_edit_sheet
from course_details_extracter import parse_module_offering_to_code

from bs4 import BeautifulSoup as bs
from dotenv import load_dotenv

from selenium import webdriver
from selenium.common import (ElementNotInteractableException,
                             NoSuchElementException, TimeoutException)
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import time

"""
timeedit mode currently does not support updating previously scraped data.
this is because of the way credits are calculated and activities are appended
if the same module is scraped again, the credits will be added to the previous credits

Hence, duplicate modules is currently an issue.
"""


def main():
    parser = argparse.ArgumentParser(
        description="A script that helps scraping different aspects of the module offerings")
    parser.add_argument("mode", choices=[
                        "timeedit", "credits", "maya", "finalise"], help="The mode to run ('timeedit' or 'maya')")
    parser.add_argument(
        "path", help="The path to the excel file or the directory containing the excel files to be parsed")
    parser.add_argument("--output", required=True,
                        help="The path to the output json file")
    args = parser.parse_args()

    if args.mode == "timeedit":
        # reset the output file for directory
        # updating is not supported in this mode because of the way credits are calculated
        # if the same module is scraped again, the credits will be added to the previous credits
        # and the activities will be duplicated
        json.dump({}, open(args.output, "w"), indent=2)

    if args.mode != "finalise" and os.path.isdir(args.path):
        files = [os.path.join(args.path, file) for file in os.listdir(
            args.path) if file.endswith(".xlsx") or file.endswith(".xls")]
    elif args.path.endswith(".xlsx"):
        files = [args.path]
    elif args.path.endswith(".json"):
        files = [args.path]

    # Perform tasks based on the mode
    match args.mode:
        case "timeedit":
            for file in files:
                print(file)
                workbook = openpyxl.load_workbook(file, read_only=True)
                sheet = get_time_edit_sheet(workbook.active)
                read_data(sheet, args.output)
        case "credits":
            assert len(files) == 1, "Only one file is allowed in 'credits' mode"
            assert files[0].endswith(".json"), "Only json files are allowed in 'credits' mode"
            update_credits(files[0], args.output)
        case "maya":
            print("What")
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
        tracker: dict[str, dict] = json.load(open(output))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        tracker: dict[str, dict] = {}

    try:
        english_name_map = json.load(open("tracker copy.json"))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        english_name_map = None

    print(f"{tracker=}")

    for row in sheet.iter_rows(min_row=sheet.header_row+1, max_row=sheet.end_row, values_only=True):
        print(row)
        module_offering = row[sheet._module_offering_column - 1]
        parsed_dict, period = parse_module_offering(module_offering)

        module = row[sheet._module_column - 1]
        # activity = "tutorial" if row[sheet._activity_column -
        #                              1].lower() == "tutorial" else "lecture"
        activity = row[sheet._activity_column - 1].lower()

        day = row[sheet._day_column - 1]
        begin_time = row[sheet._begin_column - 1]
        end_time = row[sheet._end_column - 1]

        room = _get_row_item(row, sheet._room_column - 1)

        # print(f"{parsed_dict = }")
        for code, occurences in parsed_dict.items():
            tracker.setdefault(code, {})
            # if code not in tracker:
            #     tracker[code] = {}
            for occ in occurences:

                # if this occ for this code is not found before, start tracking it
                try:
                    module_name = english_name_map[code][occ].get(
                        "module") if english_name_map else module
                    # after the change, some codes are not found in the english_name_map
                    # not sure why, so this is a temporary fix
                except KeyError:
                    module_name = module

                print(f"{module_name=}")
                tracker[code].setdefault(occ, {
                    "module": module_name or module,
                    "course_id": code,
                    "occurence": occ,
                    "credits": 0,
                    "activities": [],
                })

                # update credits for this activity
                # tracker[code][occ]["credits"] += (
                #     int(end_time.split(":")[0]) - int(begin_time.split(":")[0]))

                # add this activity to the list of activities
                tracker[code][occ]["activities"].append({
                    "title": activity,
                    "day": day,
                    "room": room,
                    "begin_time": begin_time,
                    "end_time": end_time,
                })

                # sort activities by title, and then end_time - begin_time
                tracker[code][occ]["activities"].sort(key=lambda x: (
                    x["title"], -(int(x["end_time"].split(":")[0]) - int(x["begin_time"].split(":")[0]))))

    json.dump(tracker, open(output, "w"), indent=2)


def update_credits(json_file: str, output: str):
    courses = json.load(open(json_file))
    output_data = json.load(open(output))

    load_dotenv()

    cookie_name = os.getenv("AUTHENTICATION_COOKIE_NAME")
    cookie_value = os.getenv("AUTHENTICATION_COOKIE_VALUE")

    # set the current working directory to the directory of this file
    cur_dir = os.path.dirname(os.path.abspath(__file__))

    edge_options = Options()
    edge_options.add_argument("--headless")
    edge_options.binary_location = "/usr/bin/microsoft-edge-beta"

    driver = webdriver.Edge(service=Service(
        executable_path=f"{cur_dir}/msedgedriver"), options=edge_options)
    driver.get("https://cloud.timeedit.net/my_um/web/")
    driver.add_cookie({
        "name": cookie_name,
        "value": cookie_value,
        "domain": "cloud.timeedit.net",
        "secure": True,
    })

    try:
        for course in courses:
            data_id_only = course.get("data_id_only")
            code, _, _ = parse_module_offering_to_code(course.get("data_name"))

            if code in output_data:  # necessary because courses has more courses than those with data
                if output_data[code].values().__iter__().__next__().get("credits") != 0:
                    print(f"skipping {code} because credits already calculated")
                    continue

                driver.get(f"https://cloud.timeedit.net/my_um/web/students/objects/{data_id_only}.html")

                credits = get_credits(driver, code)
                for occ in output_data[code]:
                    output_data[code][occ]["credits"] = credits

                print(f"Updated credits for {code} to {output_data[code][occ]['credits']}")
            else:
                print(f"skipping {code}")
    except Exception as e:
        print(f"stopping at {code} because of error: {e}")
        print(code, file=open("no_credits.txt", "a"))
        driver.refresh()
        print(f"{driver.get_cookies() = }")
        print(f"{driver.get_cookie(cookie_name) = }")
    finally:
        driver.quit()
        print("Finished")
        json.dump(output_data, open(output, "w"), indent=2)
        # time.sleep(1000)


def get_credits(driver, code):
    soup = bs(driver.page_source, "html.parser")

    # find single div by id
    table = soup.find('table')

    # courses_div = soup.find_all(
    #     "div", class_=["clickable2", "searchObject"])

    if not table:
        return False

    # print(table)

    # Find the row that has 'Credit Value' in the first <td> and then get the second <td> containing the value
    credit_row = table.find('td', string='Credit Value')
    credits = credit_row.find_next_sibling('td').string.strip()

    return credits


def update_data_from_maya(sheet: MayaSheet.MyReadOnlyWorksheet | MayaSheet.Worksheet, output: str):
    try:
        # try to read from json file
        tracker = json.load(open(output))
    except (FileNotFoundError, json.decoder.JSONDecodeError):
        tracker = {}

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

        if current_module_code not in tracker:
            print(f"Module '{current_module_code} {
                  current_module_name}' not in data.")
            continue

        if current_occurence not in tracker[current_module_code]:
            print(f"Occ {current_occurence} not found for module '{
                  current_module_code} {current_module_name}'")
            continue

        # update module name and mav_name
        tracker[current_module_code][current_occurence].setdefault("mav_name", tracker[current_module_code][current_occurence]["module"])
        tracker[current_module_code][current_occurence]["module"] = current_module_name

        if not (day and begin_time and end_time):
            print(f"Time details not found for Occ {current_occurence} of module '{
                  current_module_code} {current_module_name}'")
            continue

        for activity in tracker[current_module_code][current_occurence].get("activities", []):
            if activity["day"].lower() == day.lower() and \
                activity["begin_time"] == begin_time and \
                    activity["end_time"] == end_time:
                # this will update original because its a reference
                activity["tutor"] = tutor

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
        parsed_dict = {}
        period = offerings[0].split("/")[-2]
        for offering in offerings:
            code = offering.split("/")[0]
            parsed_dict.setdefault(code, [])
            parsed_dict[code].append(offering.split("/")[-1])

        return parsed_dict, period

    parsed = module_offering.split("/")
    parsed_dict = {
        parsed[0]: [parsed[-1]]
    }
    return parsed_dict, parsed[-2]


def convert_tracking_data_to_output_format(tracking_data):
    data = {code: sorted(list(occ.values()), key=lambda x: x["occurence"].rjust(
        2, " ")) for code, occ in tracking_data.items()}

    data = {key: data[key] for key in sorted(data.keys())}
    return data


if __name__ == "__main__":
    main()
