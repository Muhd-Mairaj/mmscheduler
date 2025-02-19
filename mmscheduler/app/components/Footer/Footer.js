import classes from "./Footer.module.css";

const Footer = () => {
  return (
    <div className={classes.footer}>
      <p className={classes.footerText}>
        Made with ❤️ by{" "}
        <a
          target="_blank"
          href="https://github.com/Muhd-Mairaj/"
          rel="noreferrer"
        >
          Mairaj
        </a>
        {" "}and{" "}
        <a
          target="_blank"
          href="https://github.com/Mohammed-AlSharafi/"
          rel="noreferrer"
          >
          Mohammed Alsharafi
        </a>
      </p>
    </div>
  );
};

export default Footer;
