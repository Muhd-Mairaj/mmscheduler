import classes from "./RibbonButton.module.css";

const RibbonButton = ({ children, className, onClick }) => {
  return (
    <div className={classes.bookmarkRibbon} onClick={onClick}>
      {children}
    </div>
  );
};

export default RibbonButton;
