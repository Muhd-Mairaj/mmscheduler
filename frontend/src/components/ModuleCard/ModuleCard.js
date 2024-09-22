import classes from "./ModuleCard.module.css";

const ModuleCard = ({ module, onClick }) => {
    const { key, value } = module;
    return (
        <div className={classes.moduleCard} onClick={() => onClick(key, value)}>
            <h3 className={classes.cardHeader}>{key}</h3>
        </div>
    );
};

export default ModuleCard;