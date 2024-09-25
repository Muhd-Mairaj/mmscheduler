import "../../Global.css"
import classes from "./SearchModal.module.css";
import Searchbar from "../Searchbar/Searchbar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ModuleCard from "../ModuleCard/ModuleCard";
import RoundedButton from "../RoundedButton/RoundedButton";

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
      <RoundedButton className={classes.addModuleButton} onClick={toggle}>
        + Add Modules
      </RoundedButton>
      <Modal isOpen={modal} toggle={toggle} fullscreen>
        <ModalHeader toggle={toggle}>Add modules</ModalHeader>
        <ModalBody>
          <Searchbar
            onChange={handleSearch}
            value={searchValue}
            placeholder={"Search Module"}
          />
          <ul className={classes.modalList}>
            {Object.entries(data).map(([key, value], index) => (
              <ModuleCard
                key={index}
                module={{ key, value }}
                onClick={handleModuleSelection}
              />
            ))}
          </ul>
        </ModalBody>
        <ModalFooter>
          <RoundedButton className={classes.closeButton} onClick={toggle}>
            Close
          </RoundedButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SearchModal;
