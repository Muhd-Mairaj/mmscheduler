import classes from './Navbar.module.css';
import {
  Navbar as BSNavbar,
  NavbarBrand,
} from 'reactstrap';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const Navbar = ({ isLogoHidden = false }) => {
  return (
    <BSNavbar className={classes.navbar} light expand="md" fixed='top'>
      <NavbarBrand href="/" className={classes.navbarBrand}>
        <div className={`${classes.logo} ${isLogoHidden ? classes.hidden : ""}`}>
          <p className={classes.logoFirst}>MM</p>
          <p className={classes.logoSecond}>Scheduler</p>
        </div>
      </NavbarBrand>
      <div className={classes.navbarRight}>
        <ThemeToggle />
      </div>
    </BSNavbar>
  );
};
export default Navbar;
