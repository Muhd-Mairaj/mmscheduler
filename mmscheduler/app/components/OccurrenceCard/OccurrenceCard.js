import classes from "./OccurrenceCard.module.css";

const OccurrenceCard = ({ onClick, occurrence, isDisabled, isSelected }) => {
  return (
    <button
      className={`${classes.occurrenceCard} ${isDisabled ? classes.cardDisabled : ""} ${isSelected && !isDisabled ? classes.cardSelected : ""
        }`}
      onClick={() => onClick(occurrence, isDisabled)}
    >
      <div className={classes.InnerCardWrapper}>
        <div className={classes.occurrenceNumber}>
          <p>{occurrence.occurence}</p>
        </div>
        <hr />
        
        {console.log("occurence", occurrence) || occurrence.activities.map((activity, idx) => {
          return (
            <>
              <div className={classes.activity}>
                <div className={classes.day}>
                  <p>{activity.day}</p>
                </div>
                <div className={classes.time}>
                  <p>{activity.begin_time} - {activity.end_time}</p>
                </div>
                <div className={classes.tutor}>
                  <p>{activity.tutor ? activity.tutor : ""}</p>
                </div>
              </div>
              <hr />
            </>
          )
        })}
        {/* {occurrence.lecture && (
          <div className={classes.activity}>
            <div className={classes.day}>
              <p>{occurrence.lecture.day}</p>
            </div>
            <div className={classes.time}>
              <p>{occurrence.lecture.begin_time} - {occurrence.lecture.end_time}</p>
            </div>
            <div className={classes.tutor}>
              <p>{occurrence.lecture.tutor ? occurrence.lecture.tutor : ""}</p>
            </div>
          </div>
        )}
        <hr />
        {occurrence.tutorial && (
          <div className={classes.activity}>
            <div className={classes.day}>
              <p>{occurrence.tutorial.day}</p>
            </div>
            <div className={classes.time}>
              <p>{occurrence.tutorial.begin_time} - {occurrence.tutorial.end_time}</p>
            </div>
            <div className={classes.tutor}>
              <p>{occurrence.tutorial.tutor ? occurrence.tutorial.tutor : ""}</p>
            </div>
          </div>
        )} */}
      </div>
    </button>
  );
};

export default OccurrenceCard;