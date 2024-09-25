import "../../Global.css";
import classes from "./RoundedButton.module.css";
import { Button } from "reactstrap";

const RoundedButton = ({ children, onClick, className }) => {
  return (
    <Button className={`${classes.button} ${className}`} onClick={onClick}>
      {children}
    </Button>
  );
};

export default RoundedButton;