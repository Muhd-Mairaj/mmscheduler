import classes from "./RoundedButton.module.css";
import { Button } from "reactstrap";

const RoundedButton = ({ children, onClick, className, disabled=false }) => {
  return (
    <Button className={`${classes.roundedButton} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
};

export default RoundedButton;