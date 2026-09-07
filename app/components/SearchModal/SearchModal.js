import "../../globals.css";
import { useState, useEffect } from "react";
import classes from "./SearchModal.module.css";
import Searchbar from "../Searchbar/Searchbar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ModalCard from "../SearchModalCard/SearchModalCard";
import RoundedButton from "../RoundedButton/RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import RibbonButton from "../RibbonButton/RibbonButton";

const SearchModal = ({
  modal,
  toggle,
  chosenCourses,
  handleSearch,
  handleModuleSelection,
  searchValue,
}) => {
  const [data, setData] = useState({});
  const [debounceValue, setDebounceValue] = useState("");

  const updateSearchData = (courses, chosenCourses) => {
    const filteredWithoutChosen = Object.fromEntries(
      Object.entries(courses).filter(([key, value]) => {
        return !Object.keys(chosenCourses).includes(key);
      })
    );

    return filteredWithoutChosen;
  };

  // useEffect(() => {
  //   const fetchData = async () => {
  //     await fetch("/api/get-courses?query=" + searchValue)
  //       .then((res) => res.json())
  //       .then((data) => {
  //         setData(updateSearchData(data, chosenCourses));
  //       });
  //   };
  //   fetchData();
  // }, [searchValue, chosenCourses]);

  // add debounce for search to prevent too many api calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceValue(searchValue);
    }, 400);

    return () => {
      clearInterval(timer);
    };
  }, [searchValue]);

  //
  useEffect(() => {
    if (debounceValue) {
      const fetchData = async () => {
        await fetch("/api/get-courses?query=" + searchValue)
          .then((res) => res.json())
          .then((data) => {
            setData(updateSearchData(data, chosenCourses));
          });
      };
      fetchData();
    }
  }, [debounceValue, chosenCourses]);

  return (
    <div>
      <RibbonButton onClick={toggle} />
      <Modal isOpen={modal} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>Add modules</ModalHeader>
        <ModalBody>
          <Searchbar
            onChange={handleSearch}
            value={searchValue}
            placeholder={"Search Module"}
          />
          <br />
          {Object.keys(data).length > 0 && searchValue.length > 0 ? (
            <div className={classes.listItems}>
              <ul className={classes.modalList}>
                {Object.entries(data).map(([key, value], index) => (
                  <ModalCard
                    key={index}
                    item={{ key, value }}
                    onClick={handleModuleSelection}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <div className={classes.noResults}>
              <FontAwesomeIcon
                className={classes.noResultsIcon}
                icon={searchValue.length === 0 ? faBook : faSearch}
                size="2x"
              />
              <h1 className={classes.noResultsHeader}>
                {searchValue.length === 0
                  ? "Find Your Courses!"
                  : "No Results Found!"}
              </h1>
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
