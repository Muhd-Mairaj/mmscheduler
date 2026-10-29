import { useState, useEffect } from "react";
import classes from "./ImportModal.module.css";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import readEnrollmentImage, {
  cancelEnrollmentReading,
} from "../../functions/ImportModal/readEnrollmentImage";
import {
  parseEnrollment,
  getCandidateCodes,
  matchEnrollment,
} from "../../functions/ImportModal/parseEnrollment";

const ImportModal = ({
  modal,
  toggle,
  file,
  handleImportModules,
  handleErrorMessage,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReadingText, setIsReadingText] = useState(false);
  const [foundModules, setFoundModules] = useState([]);
  const [notFoundCodes, setNotFoundCodes] = useState([]);

  // read the image every time a new one is given
  useEffect(() => {
    if (!modal || !file) {
      return;
    }

    let cancelled = false;

    const readImage = async () => {
      setIsLoading(true);
      setProgress(0);
      setIsReadingText(false);
      setFoundModules([]);
      setNotFoundCodes([]);

      try {
        const text = await readEnrollmentImage(file, (message) => {
          if (!cancelled) {
            setProgress(message.progress);
            setIsReadingText(message.status === "recognizing text");
          }
        });
        const rows = parseEnrollment(text);

        let courses = {};
        if (rows.length > 0) {
          const codes = getCandidateCodes(rows).join(",");
          courses = await fetch("/api/get-courses-by-ids?query=" + codes).then(
            (res) => res.json()
          );
        }

        if (cancelled) {
          return;
        }

        const { found, notFound } = matchEnrollment(rows, courses);
        setFoundModules(found);
        setNotFoundCodes(notFound);
      } catch (error) {
        console.error("Failed to read the screenshot", error);
        if (!cancelled) {
          handleErrorMessage("Failed to read the screenshot, please try again");
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    readImage();

    return () => {
      cancelled = true;
      // no need to keep reading when the modal was closed
      cancelEnrollmentReading();
    };
  }, [modal, file]);

  const handleAddModules = () => {
    handleImportModules(foundModules);
    toggle();
  };

  return (
    <Modal isOpen={modal} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Import from screenshot</ModalHeader>
      <ModalBody>
        {isLoading ? (
          <div className={classes.message}>
            <p className={classes.loadingText}>
              {isReadingText
                ? "Reading your screenshot…"
                : "Getting the text reader ready…"}{" "}
              {Math.round(progress * 100)}%
            </p>
            <small className={classes.note}>
              {isReadingText
                ? "This happens in your browser, the image is not uploaded."
                : "This only takes long the first time."}
            </small>
          </div>
        ) : foundModules.length > 0 ? (
          <>
            <p className={classes.resultCount}>
              Found {foundModules.length} module
              {foundModules.length === 1 ? "" : "s"}
            </p>
            <ul className={classes.moduleList}>
              {foundModules.map((module) => (
                <li key={module.code} className={classes.moduleRow}>
                  <span className={classes.moduleName}>
                    {module.code} - {module.name}
                  </span>
                  {module.occurrence ? (
                    <span className={classes.occurrence}>
                      Occurrence {module.occurrence.occurence}
                    </span>
                  ) : (
                    <span className={classes.missingOccurrence}>
                      Occurrence not found
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {notFoundCodes.length > 0 && (
              <p className={classes.note}>
                Couldn&apos;t find: {notFoundCodes.join(", ")}. You can add{" "}
                {notFoundCodes.length === 1 ? "it" : "them"} by searching.
              </p>
            )}
          </>
        ) : (
          <div className={classes.message}>
            <FontAwesomeIcon className={classes.noResultsIcon} icon={faImage} />
            <h1 className={classes.noResultsHeader}>No Modules Found!</h1>
            <small className={classes.note}>
              Try a clearer screenshot of your registered modules table.
            </small>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <RoundedButton
          className="acceptButton"
          onClick={handleAddModules}
          disabled={isLoading || foundModules.length === 0}
        >
          Add modules
        </RoundedButton>
      </ModalFooter>
    </Modal>
  );
};

export default ImportModal;
