import classes from "./RibbonButton.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const RibbonButton = ({ children, onClick }) => {
  return (
    <>
      <div className={classes.bookmarkRibbon} onClick={onClick}>
        <FontAwesomeIcon icon={faPlus} className={classes.addModuleIcon} />
      </div>
      <div className={classes.floatingActionButton} onClick={onClick}>
        <FontAwesomeIcon icon={faPlus} />
      </div>
    </>
  );
};

export default RibbonButton;
