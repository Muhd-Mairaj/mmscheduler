import { FAQ, SEMESTER } from "../seo";
import classes from "./SeoContent.module.css";

/** Server-rendered, crawlable description of the app (visible below the planner). */
export default function SeoContent() {
  return (
    <section className={classes.seo} aria-labelledby="about-heading">
      <div className={classes.inner}>
        <h2 id="about-heading">UM timetable planner for Universiti Malaya students</h2>
        <p>
          MMScheduler is a free, unofficial <strong>University of Malaya (UM) timetable planner</strong>. Search every
          module offered for <strong>{SEMESTER}</strong>, compare the occurrences (sections), and build a
          weekly class and exam timetable without clashes, before you register.
        </p>

        <h3>How to plan your UM timetable</h3>
        <ol>
          <li>Search a module by code or name and add it to your list.</li>
          <li>Pick one occurrence per module. Clashing occurrences are disabled for you.</li>
          <li>Or paste a screenshot of your enrollment and let the planner add everything.</li>
          <li>Use Auto-schedule to optimise for lecturers, days off and class hours.</li>
          <li>Save your timetable as an image to share or keep.</li>
        </ol>

        <h3>Frequently asked questions</h3>
        <div className={classes.faq}>
          {FAQ.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        <p className={classes.legal}>
          MMScheduler is a personal project by{" "}
          <a href="https://github.com/Muhd-Mairaj/" rel="noopener">Mairaj</a> and{" "}
          <a href="https://github.com/Mohammed-AlSharafi/" rel="noopener">Mohammed Alsharafi</a>. Not affiliated with
          Universiti Malaya. Always verify your final schedule against official UM systems.{" "}
          <a href="https://github.com/Muhd-Mairaj/mmscheduler" rel="noopener">Source code</a>.
        </p>
      </div>
    </section>
  );
}
