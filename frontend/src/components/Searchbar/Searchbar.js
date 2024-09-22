import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from "./Searchbar.module.css";
import { Button, Input } from "reactstrap";
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const Searchbar = ({ onChange, value, onSubmit, placeholder }) => {
  return (
    <div className={classes.searchBlock}>
      <Input
        className={classes.searchbar}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
      />
      <Button onClick={onSubmit} className={classes.searchButton}>
        <FontAwesomeIcon icon={faSearch} />
      </Button>
    </div>
  );
};

export default Searchbar;
