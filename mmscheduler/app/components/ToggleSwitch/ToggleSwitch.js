import React from 'react';
import classes from './ToggleSwitch.module.css';

const ToggleSwitch = ({ isChecked, onToggle, className }) => {
  return (
    <label className={`${classes.switch} ${className}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
      />
      <span className={classes.slider}></span>
    </label>
  );
};

export default ToggleSwitch;