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

    @property
    def header_row(self) -> int:
        return self._header_row

    @property
    def end_row(self) -> int:
        return self._end_row

    @property
    def header(self) -> tuple:
        return self._header


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
        self._week_column = 0
        self._day_column = 0
        self._begin_column = 0
        self._end_column = 0
        self._module_column = 0
        self._module_offering_column = 0
        self._activity_column = 0
        self._room_column = 0

        # find header row
        # start at 1 because indexing is 1-based
        for i, row in enumerate(self.iter_rows(min_row=self.min_row, max_row=self.max_row, values_only=True), self.min_row):
            for j, cell_value in enumerate(row, 1):
                if cell_value == None:
                    continue

                elif cell_value.strip().lower() == "week":
                    self._week_column = j
                elif cell_value.strip().lower() == "weekday":
                    self._day_column = j
                elif cell_value.strip().lower() == "begin time":
                    self._begin_column = j
                elif cell_value.strip().lower() == "end time":
                    self._end_column = j
                elif cell_value.strip().lower() == "module":
                    self._module_column = j
                elif cell_value.strip().lower() == "module offering":
                    self._module_offering_column = j
                elif cell_value.strip().lower() == "activity":
                    self._activity_column = j
                elif cell_value.strip().lower() == "room":
                    self._room_column = j

            if self._week_column != 0 and self._day_column != 0 and self._begin_column != 0 and self._end_column != 0 and self._module_offering_column != 0 and self._activity_column != 0 and self._room_column != 0:
                self._header_row = i
                break

        self._header = self.iter_rows(
            min_row=self._header_row, max_row=self._header_row, values_only=True).__next__()

        # continue from the header row to find end row
        start_week = 0
        for i, row in enumerate(self.iter_rows(min_row=self._header_row + 1, max_row=self.max_row, values_only=True), self._header_row + 1):
            if start_week == 0:
                start_week = row[self._week_column - 1]

            # next week started
            if row[self._week_column - 1] != start_week:
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
