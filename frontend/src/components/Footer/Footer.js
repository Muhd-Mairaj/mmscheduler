import classes from "./Footer.module.css";

const Footer = () => {
  return (
    <div className={classes.footer}>
      <p className={classes.footerText}>
        Made with ❤️ by{" "}
        <a
          target="_blank"
          href="https://github.com/Muhd-Mairaj/"
        >
          Mairaj
        </a>
        {" "}and{" "}
        <a
          target="_blank"
          href="https://github.com/Mohammed-AlSharafi/">
          Alsharafi
        </a>
      </p>
    </div>
  );
};

export default Footer;
