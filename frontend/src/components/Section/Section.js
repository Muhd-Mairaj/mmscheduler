import classes from "./Section.module.css";
import CardComponent from "../Card/Card";

const Section = ({ title, sectionData, addCourse, checkClash }) => {
  return (
    <section className={classes.section}>
      <h2>{title}:</h2>
      <div className="card-container">
        {Array.isArray(sectionData) &&
          sectionData.map((course, index) => (
            <CardComponent
              key={index}
              course={course}
              addCourse={addCourse}
              checkClash={checkClash}
            />
          ))}
      </div>
    </section>
  );
};

export default Section;
