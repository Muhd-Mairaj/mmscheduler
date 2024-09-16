import openpyxl
import json
import my_sheet


def main():
    # change this to the path of the excel file
    excel_file_path = "timetable_sem3.xlsx"
    json_file_path = "one_week_schedule.json"
    workbook = openpyxl.load_workbook(excel_file_path, read_only=True)
    sheet = my_sheet.get_sheet(workbook.active)

    data = read_data(sheet)
    json.dump(data, open(json_file_path, "w"), indent=4)


def read_data(sheet: my_sheet.MyReadOnlyWorksheet | my_sheet.Worksheet):
    data = {}
    for row in sheet.iter_rows(min_row=sheet.header_row+1, max_row=sheet.end_row, values_only=True):
        module_offering = row[sheet._module_offering_column - 1]
        code, occurence = parse_module_offering(module_offering)

        module = row[sheet._module_column - 1]
        activity = row[sheet._activity_column - 1]
        room = row[sheet._room_column - 1]
        day = row[sheet._day_column - 1]
        begin_time = row[sheet._begin_column - 1]
        end_time = row[sheet._end_column - 1]

        if code not in data:
            data[code] = {}
            data[code]["Module"] = module

        if day not in data[code]:
            data[code][day] = []

        data[code][day].append({
            "Occurences": occurence,
            "Activity": activity,
            "Room": room,
            "Begin Time": begin_time,
            "End Time": end_time,
        })

    return data


def parse_module_offering(module_offering: str) -> tuple:
    offerings = module_offering.split(", ")
    if len(offerings) != 1:
        code = offerings[0].split("/")[0]
        occ = [offering.split("/")[-1] for offering in offerings]
        return code, occ

    parsed = module_offering.split("/")
    return parsed[0], [parsed[-1]]


if __name__ == "__main__":
    main()
