import classes from "./RoundedButton.module.css";
import { Button } from "reactstrap";

const RoundedButton = ({ children, onClick, className }) => {
  return (
    <Button className={`${classes.roundedButton} ${className}`} onClick={onClick}>
      {children}
    </Button>
  );
};

export default RoundedButton;