const OccButton = ({ onClick, occurrence, isDisabled, isSelected }) => {
  return (
    <button
      className={`occurrence-button ${isDisabled ? "disabled" : ""} ${
        isSelected ? "selected" : ""
      }`}
      onClick={() => onClick(occurrence, isDisabled)}
    >
      <div className="occurrence">
        <div className="occ-number">{occurrence.occurence}</div>
        <hr />
        {occurrence.lecture && (
          <div className="activity">
            <div className="time">
              {occurrence.lecture.day}
              <br />
              {occurrence.lecture.begin_time} - {occurrence.lecture.end_time}
              {/* <div className="room">{occurrence.lecture.room}</div> */}
            </div>
          </div>
        )}
        <hr />
        {occurrence.tutorial && (
          <div className="activity">
            <div className="time">
              {occurrence.tutorial.day}
              <br />
              {occurrence.tutorial.begin_time} - {occurrence.tutorial.end_time}
              {/* <div className="room">{occurrence.tutorial.room}</div> */}
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default OccButton;
