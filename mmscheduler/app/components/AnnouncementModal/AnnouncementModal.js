import "../../globals.css";
import { useState, useEffect } from "react";
import classes from "./AnnouncementModal.module.css";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";

const AnnouncementModal = ({ modal, toggle }) => {
  return (
    <div>
      <Modal isOpen={modal} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>Announcement</ModalHeader>
        <ModalBody>
          <div className={classes.announcementMessage}>
            <h3>Congratulations On Completing Semester 1! 🎉</h3>
          </div>

          <div className={classes.announcementMessage}>
            <ul>
              <li>
              We will be filling in the new course information soon. Please stay
              tuned for updates!
              </li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <RoundedButton
            className={`${classes.closeButton} acceptButton`}
            onClick={toggle}
          >
            Finish
          </RoundedButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AnnouncementModal;
