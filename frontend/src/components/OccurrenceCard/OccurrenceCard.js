import "../../Global.css"
import classes from "./OccurrenceCard.module.css";

const OccurrenceCard = ({ onClick, occurrence, isDisabled, isSelected }) => {
  return (
    <button
      className={`${classes.occurrenceCard} ${isDisabled ? classes.cardDisabled : ""} ${
        isSelected && !isDisabled ? classes.cardSelected : ""
      }`}
      onClick={() => onClick(occurrence, isDisabled)}
    >
      <div className={classes.InnerCardWrapper}>
        <div className={classes.occurrenceNumber}>
          <p>{occurrence.occurence}</p>
        </div>
        <hr />
        {occurrence.lecture && (
          <div className="activity">
            <div className="day">
              <p>{occurrence.lecture.day}</p>
            </div>
            <div className="time">
              <p>{occurrence.lecture.begin_time} - {occurrence.lecture.end_time}</p>
            </div>
            <div className="tutor">
              <p>{occurrence.lecture.tutor ? occurrence.lecture.tutor : ""}</p>
            </div>
          </div>
        )}
        <hr />
        {occurrence.tutorial && (
          <div className="activity">
            <div className="day">
              <p>{occurrence.tutorial.day}</p>
            </div>
            <div className="time">
              <p>{occurrence.tutorial.begin_time} - {occurrence.tutorial.end_time}</p>
            </div>
            <div className="tutor">
              <p>{occurrence.tutorial.tutor ? occurrence.tutorial.tutor : ""}</p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default OccurrenceCard;
