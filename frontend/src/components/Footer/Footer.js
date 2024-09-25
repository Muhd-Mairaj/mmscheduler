import classes from "./Footer.module.css";

const Footer = () => {
  return (
    <div className={classes.footer}>
      <p className={classes.footerText}>
        Made with ❤️ by{" "}
        <a
          target="_blank"
          href="https://www.linkedin.com/in/muhd-mairaj-4b194b294/"
        >
          Mairaj
        </a>{" "}
        and{" "}
        <a target="_blank" href="https://www.linkedin.com/in/m-n-al-sharafi/">
          Alsharafi
        </a>
      </p>
    </div>
  );
};

export default Footer;
