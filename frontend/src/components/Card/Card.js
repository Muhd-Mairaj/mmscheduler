import classes from "./Card.module.css";

const Card = ({ course, addCourse, checkClash }) => {
    const module = course?.module ?? "NaN";
    const occurrence = course?.occurence ?? "NaN";
    const lectureRoom = course?.lecture?.room ?? "NaN";
    const lectureBeginTime = course?.lecture?.begin_time ?? "NaN";
    const lectureEndTime = course?.lecture?.end_time ?? "NaN";
    const tutorialRoom = course?.tutorial?.room ?? "NaN";
    const tutorialBeginTime = course?.tutorial?.begin_time ?? "NaN";
    const tutorialEndTime = course?.tutorial?.end_time ?? "NaN";
    const lectureDay = course?.lecture?.day ?? "NaN";
    const tutorialDay = course?.tutorial?.day ?? "NaN";
    const isClash = checkClash(course);

    return (
        <div className={`${classes.card} ${isClash ? classes.clash : ''}`} onClick={() => {if (!isClash) addCourse(course)}}>
            {console.log(course)}
            <div className={classes.Header}>
                <h3 className={classes.title}>{module}</h3>
                <p>{occurrence}</p>
            </div>
            <div className={classes.Content}>
                <div className={classes.Lecture}>
                    <h4>Lecture</h4>
                    <p>Room: {lectureRoom}</p>
                    <p>Day: {lectureDay}</p>
                    <p>Time: {lectureBeginTime} - {lectureEndTime}</p>
                </div>
                <div className={classes.Tutorial}>
                    <h4>Tutorial</h4>
                    <p>Room: {tutorialRoom}</p>
                    <p>Day: {tutorialDay}</p>
                    <p>Time: {tutorialBeginTime} - {tutorialEndTime}</p>
                </div>
            </div>
        </div>
    );
};

export default Card;