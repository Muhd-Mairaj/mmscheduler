"use client";

import { useMemo } from "react";
export const useReactSelectTheme = () => {

  const customStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--searchbar-bg-color)',
      borderColor: state.isFocused ? 'var(--primary-color)' : 'var(--grid-border-color)',
      color: 'var(--text-primary-color)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--primary-color)' : 'none',
      borderWidth: '1px',
      '&:hover': {
        borderColor: 'var(--primary-color)',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--background-secondary-color)',
      border: '1px solid var(--grid-border-color)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--selected-card-color)'
        : state.isFocused
          ? 'var(--modal-card-hover-bg)'
          : 'transparent',
      color: state.isSelected ? '#fff' : 'var(--text-primary-color)',
      '&:active': {
        backgroundColor: 'var(--selected-card-color)',
        opacity: 0.8,
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--grid-settings-bg)',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--text-primary-color)',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'var(--text-secondary-color)',
      '&:hover': {
        backgroundColor: 'var(--primary-color)',
        color: '#fff',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--text-primary-color)',
    }),
    input: (base) => ({
      ...base,
      color: 'var(--text-primary-color)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--text-muted-color)',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: 'var(--grid-border-color)',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--text-muted-color)',
      '&:hover': {
        color: 'var(--text-secondary-color)',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--text-muted-color)',
      '&:hover': {
        color: 'var(--text-secondary-color)',
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: 'var(--text-muted-color)',
    }),
  }), []);

  return customStyles;
};

export default useReactSelectTheme;
