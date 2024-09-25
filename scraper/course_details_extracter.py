import json
import os
import time

import requests
from bs4 import BeautifulSoup as bs
from dotenv import load_dotenv
from main import parse_module_offering
from selenium import webdriver
from selenium.common import (ElementNotInteractableException,
                             NoSuchElementException, TimeoutException)
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.microsoft import EdgeChromiumDriverManager


load_dotenv()

cookie_name = os.getenv("AUTHENTICATION_COOKIE_NAME")
cookie_value = os.getenv("AUTHENTICATION_COOKIE_VALUE")


def main():
    # set the current working directory to the directory of this file
    cur_dir = os.path.dirname(os.path.abspath(__file__))

    edge_options = Options()
    # edge_options.add_argument("--headless")
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

    # extract data for all courses
    info = json.load(open("info.json"))
    if "start" not in info:
        info["start"] = 0
    json.dump(info, open("info.json", "w"), indent=2)

    scrape_all_courses(driver, info["start"])
    
    # done scraping 

    driver.get("https://cloud.timeedit.net/my_um/web/students/ri1Q8.html")
    time.sleep(2)

    # change to module offering
    driver.execute_script("""
        var selector = document.getElementById("fancytypeselector")
        selector.value = "5";
        selector.dispatchEvent(new Event("change"));
    """)
    time.sleep(0.5)

    # add courses to scheduler (1000 at a time -- need to automate this process)
    info = json.load(open("info.json"))
    if "offset" not in info:
        info["offset"] = 0
    data = get_courses(1000, offset=info["offset"])

    add_courses_to_scheduler(driver, data)
    info = json.load(open("info.json"))
    info["offset"] += 1000      # assuming all 1000 courses are added, no error checking added yet
    json.dump(info, open("info.json", "w"), indent=2)

    print("Program execution over.")
    time.sleep(10000)


def scrape_all_courses(driver, start=0):
    scheduler_adding_data = json.load(open("courses.json"))
    tracker_data_for_frontend = json.load(open("tracker.json"))

    while True:
        max_limit = "" if start == 0 else "1000"

        url = f"https://cloud.timeedit.net/my_um/web/students/objects?" + \
            f"max={max_limit}" + \
            f"&fr=t" + \
            f"&partajax=t" + \
            f"&im=f" + \
            f"&sid=4" + \
            f"&l=en_U" + \
            f"&objects=" + \
            f"&types=5" + \
            f"&fe=82.2024" + \
            f"&fe=83.S1" + \
            f"&start={start}" + \
            f"&part=t" + \
            f"&media=html"

        print(f"{url=}")
        driver.get(url)

        try:
            WebDriverWait(driver, 10).until(
                lambda driver: _course_extracter(
                    driver, scheduler_adding_data, tracker_data_for_frontend, start
                ),
                "No more courses found"
            )
            # this is also the next start index
            start = len(scheduler_adding_data)
            save_data(scheduler_adding_data, tracker_data_for_frontend, start)
        except TimeoutException as e:
            print(e)
            break

    start = len(scheduler_adding_data)
    print(f"count = {start}")
    save_data(scheduler_adding_data, tracker_data_for_frontend, start)


def _course_extracter(driver, data, tracker, start):
    soup = bs(driver.page_source, "html.parser")

    courses_div = soup.find_all(
        "div", class_=["clickable2", "searchObject"])

    if not courses_div:
        return False

    for course in courses_div:
        try:
            data_id = course["data-id"]
            data_name = course["data-name"]

            code, occurences = parse_module_offering(data_name)

            # find the name in the table element within this div
            driver.get(
                f"https://cloud.timeedit.net/my_um/web/students/objects/{course['data-idonly']}.html")
            sub_soup = bs(driver.page_source, "html.parser")

            table = sub_soup.find('table', class_='objectfieldsextra')

            # Find the row that has 'Name' in the first <td> and then get the second <td> containing the value
            name_row = table.find('td', string='Name')
            name_value = name_row.find_next_sibling('td').string
            name = name_value.strip()

            for occ in occurences:
                if code not in tracker:
                    tracker[code] = {}

                # if this occ for this code is not found before, start tracking it
                if occ not in tracker[code]:
                    tracker[code][occ] = {
                        "module": name,
                        "course_id": code,
                        "occurence": occ,
                    }

            print(f"count = {start+1}, {data_id=}, {data_name=}")

            data.append({
                "count": start+1,
                "data_id": data_id,
                "data_name": data_name
            })
            start += 1
        except Exception as e:
            print(e)
            print(f"count = {start+1}", file=open("errors.txt", "a"))
            print(f"{data_id=}, {data_name=}", file=open("errors.txt", "a"))
            print(f"{code=}, {occurences=}", file=open("errors.txt", "a"))
            print(f"{name=}", file=open("errors.txt", "a"))
            print(f"html: {sub_soup.prettify()}")
            print("---------------------------------------",
                  file=open("errors.txt", "a"))
            return False

    return True


def save_data(scheduler_adding_data, tracker_data_for_frontend, start):
    json.dump(scheduler_adding_data, open("courses.json", "w"), indent=2)
    json.dump(tracker_data_for_frontend, open("tracker.json", "w"), indent=2)

    info = json.load(open("info.json"))
    info["start"] = start
    json.dump(info, open("info.json", "w"), indent=2)


def add_courses_to_scheduler(driver, data):
    for course in data:
        try:
            WebDriverWait(driver, 20).until(
                lambda driver: driver.execute_script(
                    "return typeof addBasketItem === 'function';"
                ),
                "Did not find addBasketItem function"
            )

            add_item_to_basket(driver, course["data_id"], course["data_name"])
            print(f"Item {course["data_name"]
                          } added to the basket successfully.")
        except TimeoutException as e:
            print(e)
            print(f"Item {course['data_name']} not added to the basket.", file=open("errors.txt", "a"))


def add_item_to_basket(driver, data_id, data_name):
    is_defined = driver.execute_script(
        "return typeof addBasketItem === 'function';")

    basket_id = "objectbasket"

    if is_defined:
        driver.execute_script(f"""
            var basket = $("#{basket_id}");
            addBasketItem(basket, "{data_id}", "{data_name}");
        """)
        print(f"Item {data_id} added to the basket successfully.")
        return True
    else:
        print("addBasketItem is not defined on this page.")
        return False


def add_selected_to_basket(driver):
    driver.execute_script("addallbutton();")


def get_courses(amount, offset=0):
    data = json.load(open("courses.json"))[offset:offset+amount]
    return data


# def click_search_button(driver):
#     try:
#         button = WebDriverWait(driver, 10).until(
#             EC.presence_of_element_located(
#                 (By.XPATH,
#                  "//*[@id='searchDivContent2']/div[2]/div[1]/div/div/input[2]")
#             )
#         )
#         time.sleep(1)
#         button.click()
#     except Exception as e:
#         print(e)


# def click_next_page(driver):
#     while True:
#         try:
#             button = WebDriverWait(driver, 10).until(
#                 EC.presence_of_element_located((By.ID, "nextPageButton_o"))
#             )
#             time.sleep(0.1)
#             button.click()
#         except Exception as e:
#             print(e)
#             break


if __name__ == "__main__":
    main()
