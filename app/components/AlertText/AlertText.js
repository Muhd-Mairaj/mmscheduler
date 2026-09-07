import { Alert } from "reactstrap";
import classes from "./AlertText.module.css";
import { useEffect, useState } from "react";

const AlertText = ({ alertText, setAlertText }) => {
  const [fadeOut, setFadeOut] = useState(false);

  const toggle = () => {
    setFadeOut(false);
    setAlertText("");
  };

  useEffect(() => {
    if (alertText.length > 0) {
      //hide the alert after 5 seconds
      const timer = setTimeout(() => {
        setFadeOut(true);

        setTimeout(() => {
          toggle();
        }, 500); //match with css
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alertText]); 

  return (
    <>
      {alertText.length > 0 && (
        <Alert
          color="danger"
          className={`${classes.alert} ${fadeOut ? classes.fadeOut : ''}`} // Add fadeOut class when needed
          isOpen={alertText.length !== 0}
          toggle={toggle}
        >
          {alertText}
        </Alert>
      )}
    </>
  );
};

export default AlertText;
