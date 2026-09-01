# MMScheduler

MMScheduler is an unofficial timetable planner for University of Malaya students. It helps you compare module occurrences, avoid clashes, and put together a class and exam schedule.

**[Try MMScheduler](https://mmscheduler.netlify.app/)**

> MMScheduler is a personal project and is not affiliated with Universiti Malaya. Timetable information may be incomplete or change, so always check your final schedule against official UM systems.

The latest data refresh targets **Semester 1, 2026/2027** (`2026/S1`). Some records may keep older period labels from the source data. The project has been used by UM students over the past four semesters.

## Features

- Search for modules by code or name
- Compare class times, rooms, and lecturers across occurrences
- Automatically disable clashing occurrences
- Generate a schedule with **AI Scheduling** based on lecturer and day-off preferences
- View separate class and exam timetables
- Track selected credits and download timetables as PNGs
- Keep your plan in local browser storage
- Light and dark themes

### About AI Scheduling

AI Scheduling is a local heuristic, not an LLM. It tries every possible combination, removes clashes, scores the remaining schedules using your preferences, and picks the best result. It runs in a Web Worker in your browser and does not send your schedule to an external AI service.

It may take longer when you add many modules with many occurrences.

## Run locally

You need Node.js 20.9 or newer.

```bash
git clone https://github.com/Muhd-Mairaj/mmscheduler.git
cd mmscheduler/mmscheduler
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables or database are required.

For a production build:

```bash
npm run build
npm run start
```

## Updating timetable data

Current data comes from Joshua Chew's [UM Timetable SDK](https://github.com/damnitjoshua/um-timetable-sdk). Follow its instructions to generate:

- `course_events_with_details.json`
- `lecturer_data.json`

Place both files in `toolmod/`, then run the conversion scripts from the repository root. Python 3.12 or newer is required.

```bash
cd toolmod
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt

node cleaner.js course_events_with_details.json lecturer_data.json
python main.py ../mmscheduler/app/all_courses_updated_one_week_schedule_occ_separated.json

cd ../mmscheduler
npm ci
npm run build
```

The raw SDK files are ignored by Git and may contain lecturer contact or personnel information. Do not commit them. The older `scraper/` directory is kept for reference and is no longer the active data pipeline.

The SDK workflow above is summarized from its linked documentation. Content was rephrased for compliance with licensing restrictions.

## Built with

Next.js 16, React 19, CSS Modules, Bootstrap/Reactstrap, Font Awesome, and `html2canvas`. The app is deployed on Netlify and uses a bundled JSON dataset rather than querying TimeEdit directly.

## Authors

Made by [Mairaj](https://github.com/Muhd-Mairaj/) and [Mohammed Alsharafi](https://github.com/Mohammed-AlSharafi/). The name **MMScheduler** is a play on our names.

Licensed under the [MIT License](LICENSE).
