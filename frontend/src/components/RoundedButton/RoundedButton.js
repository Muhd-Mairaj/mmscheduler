import "../../Global.css";
import classes from "./RoundedButton.module.css";
import { Button } from "reactstrap";

const RoundedButton = ({ children, onClick }) => {
  return (
    <Button className={classes.button} onClick={onClick}>
      {children}
    </Button>
  );
};

export default RoundedButton;