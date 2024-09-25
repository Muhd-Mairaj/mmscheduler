import classes from './Navbar.module.css';
import {
  Navbar as BSNavbar,
  NavbarBrand,
} from 'reactstrap';

const Navbar = ({isLogoHidden = false}) => {
  return (
    <BSNavbar className={classes.navbar} light expand="md" fixed='top'>
      <NavbarBrand href="/" className={classes.navbarBrand}>
        <div className={`${classes.logo} ${isLogoHidden? classes.hidden : ""}`}>
          <p className={classes.logoFirst}>MM</p>
          <p className={classes.logoSecond}>Scheduler</p>
        </div>
      </NavbarBrand>
    </BSNavbar>
  );
};
export default Navbar;
