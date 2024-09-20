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
        pass


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
