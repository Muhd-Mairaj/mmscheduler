from openpyxl.worksheet import _read_only
from openpyxl.worksheet.worksheet import Worksheet


class MySheet():
    pass


class MyWorksheet(Worksheet, MySheet):
    # def __init__(self, parent: _read_only.Workbook | None, title: str | _write_only._Decodable | None = None) -> None:
    #     super().__init__(parent, title)
    def __init__(self, sheet: Worksheet) -> None:
        raise NotImplementedError(
            "Please use read_only=True when opening the workbook")

    def _my_setup(self):
        pass


class MyReadOnlyWorksheet(_read_only.ReadOnlyWorksheet, MySheet):
    def __init__(self, read_only_worksheet: _read_only.ReadOnlyWorksheet) -> None:
        # initialize the parent class with the same values
        self.parent = read_only_worksheet.parent
        self.title = read_only_worksheet.title
        self.sheet_state = read_only_worksheet.sheet_state
        self._current_row = read_only_worksheet._current_row
        self._worksheet_path = read_only_worksheet._worksheet_path
        self._shared_strings = read_only_worksheet._shared_strings
        self._get_size = read_only_worksheet._get_size
        self.defined_names = read_only_worksheet.defined_names

        # initialize the custom properties
        self._my_setup()

    def _my_setup(self):
        self._module_code_column = 0
        self._module_name_column = 0
        self._occurrence_column = 0
        self._mav_name_column = 0
        self._activity_column = 0
        self._time_details_column = 0
        self._tutor_column = 0
        self._room_column = 0

        # find header row and column indexes
        # start at 1 because indexing is 1-based
        for i, row in enumerate(self.iter_rows(min_row=self.min_row, max_row=self.max_row, values_only=True), self.min_row):
            if (i == 15): return
            for j, cell_value in enumerate(row, 1):
                if cell_value is None or not isinstance(cell_value, str):
                    continue

                match cell_value.lower().strip():
                    case "module code":
                        self._module_code_column = j
                    case "module name":
                        self._module_name_column = j
                    case "occurrence":
                        self._occurrence_column = j
                    case "mav name":
                        self._mav_name_column = j
                    case "activity":
                        self._activity_column = j
                    case "day / start duration":
                        self._time_details_column = j
                    case "tutor":
                        self._tutor_column = j
                    case "room":
                        self._room_column = j
                    case _:
                        pass

            if self._module_code_column != 0 and self._module_name_column != 0 and self._occurrence_column != 0 and self._activity_column != 0 and self._time_details_column != 0 and self._tutor_column != 0 and self._room_column != 0:
                self._header_row = i
                print("Setting _header_row as ", i)
                print()
                break

        # set header
        self._header = self.iter_rows(min_row=self._header_row, max_row=self._header_row, values_only=True).__next__()

        # find end_row
        for i, row in enumerate(self.iter_rows(min_row=self._header_row + 1, max_row=self.max_row, values_only=True), self._header_row + 1):
            if not row:
                self._end_row = i - 1
                break

    @property
    def header_row(self) -> int:
        return self._header_row

    @property
    def end_row(self) -> int:
        return self._end_row

    @property
    def header(self) -> tuple:
        return self._header


def get_sheet(sheet: Worksheet | _read_only.ReadOnlyWorksheet) -> MyWorksheet | MyReadOnlyWorksheet:
    """This is the method that should be used to encapsulate the openpyxl worksheet with the required class.


    Args:
        sheet (Worksheet | ReadOnlyWorksheet): The worksheet that needs to be encapsulated

    Returns:
        MyWorksheet | MyReadOnlyWorksheet: The encapsulated worksheet with additional properties
    """
    if isinstance(sheet, Worksheet):
        return MyWorksheet(sheet)

    if isinstance(sheet, _read_only.ReadOnlyWorksheet):
        return MyReadOnlyWorksheet(sheet)
