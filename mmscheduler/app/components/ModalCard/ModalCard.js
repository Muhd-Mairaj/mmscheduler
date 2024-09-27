import classes from "./ModalCard.module.css";

const ModalCard = ({ item, onClick }) => {
    const { key, value } = item;
    return (
        <div className={classes.modalCard} onClick={() => onClick(key, value)}>
            <h3 className={classes.cardHeader}>{key}</h3>
        </div>
    );
};

export default ModalCard;