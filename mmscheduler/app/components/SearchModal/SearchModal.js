import "../../globals.css"
import classes from "./SearchModal.module.css";
import Searchbar from "../Searchbar/Searchbar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ModalCard from "../ModalCard/ModalCard";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import RibbonButton from "../BookmarkButton/RibbonButton";

const SearchModal = ({
  modal,
  toggle,
  data,
  handleSearch,
  handleModuleSelection,
  searchValue,
}) => {
  return (
    <div>
      <RibbonButton
        onClick={toggle}
      >
        <FontAwesomeIcon icon={faPlus} className={classes.addModuleText} />
      </RibbonButton>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Add modules</ModalHeader>
        <ModalBody>
          <Searchbar
            onChange={handleSearch}
            value={searchValue}
            placeholder={"Search Module"}
          />
          {Object.keys(data).length > 0 && searchValue.length > 0? (
            <ul className={classes.modalList}>
              {Object.entries(data).map(([key, value], index) => (
                <ModalCard
                  key={index}
                  item={{ key, value }}
                  onClick={handleModuleSelection}
                />
              ))}
            </ul>
          ) : (
            <div className={classes.noResults}>
              <FontAwesomeIcon
                className={classes.noResultsIcon}
                icon={searchValue.length === 0? faBook : faSearch}
                size="2x"
              />
              <h1 className={classes.noResultsHeader}>{searchValue.length === 0? "Find Your Courses!" : "No Results Found!"}</h1>
            </div>
          )}
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

export default SearchModal;
