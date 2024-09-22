import { useState } from "react";
import Searchbar from "../Searchbar/Searchbar";
import classes from "./SearchModal.module.css";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ModuleCard from "../ModuleCard/ModuleCard";

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
      <Button color="warning" onClick={toggle}>
        Add Modules
      </Button>
      <Modal isOpen={modal} toggle={toggle} fullscreen>
        <ModalHeader toggle={toggle}>Add modules</ModalHeader>
        <ModalBody>
          <Searchbar
            onChange={handleSearch}
            value={searchValue}
            placeholder={"Search Module"}
          />
          <ul>
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
          <Button color="secondary" onClick={toggle}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SearchModal;
