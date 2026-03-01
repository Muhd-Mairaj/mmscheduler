"use client";

import { useTheme } from "../context/ThemeContext";

/**
 * Returns custom styles for react-select that respond to the current theme.
 */
export const useReactSelectTheme = () => {
  const { isDark } = useTheme();

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? '#2a2a45' : '#fff',
      borderColor: isDark
        ? (state.isFocused ? '#9b72b8' : 'rgba(80, 80, 120, 0.4)')
        : (state.isFocused ? '#7e569c' : '#ccc'),
      color: isDark ? '#e0e0e0' : '#333',
      boxShadow: state.isFocused
        ? `0 0 0 1px ${isDark ? '#9b72b8' : '#7e569c'}`
        : 'none',
      '&:hover': {
        borderColor: isDark ? '#9b72b8' : '#7e569c',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#232342' : '#fff',
      border: isDark ? '1px solid rgba(80, 80, 120, 0.4)' : '1px solid #ccc',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDark ? '#7a5a92' : '#7e569c')
        : state.isFocused
          ? (isDark ? '#3a3a5a' : '#f0e8f5')
          : 'transparent',
      color: state.isSelected
        ? '#fff'
        : (isDark ? '#e0e0e0' : '#333'),
      '&:active': {
        backgroundColor: isDark ? '#6a4a7a' : '#e0d0ea',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#3a3a5a' : '#e8dff0',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#e0e0e0' : '#333',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#b0b0c0' : '#666',
      '&:hover': {
        backgroundColor: isDark ? '#5a5a7a' : '#d0c0e0',
        color: isDark ? '#fff' : '#333',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#e0e0e0' : '#333',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#e0e0e0' : '#333',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#8888a0' : '#999',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? 'rgba(80, 80, 120, 0.4)' : '#ccc',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#8888a0' : '#999',
      '&:hover': {
        color: isDark ? '#b0b0c0' : '#666',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#8888a0' : '#999',
      '&:hover': {
        color: isDark ? '#b0b0c0' : '#666',
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: isDark ? '#8888a0' : '#999',
    }),
  };

  return customStyles;
};

export default useReactSelectTheme;
