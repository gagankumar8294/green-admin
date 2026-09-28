"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./CustomDropdown.module.css";

/**
 * Shared CustomDropdown Component
 * Styled and animated in the exact manner of the frontend green project (SortDropdown in ProductClient)
 * 
 * @param {Array} options - Array of { value, label, disabled?, icon? } or primitives [1, 2, "a"]
 * @param {any} value - Selected value
 * @param {Function} onChange - Callback fired on change: (event, value) => void
 * @param {Function} onSelect - Optional direct callback: (value, option) => void
 * @param {string} placeholder - Placeholder text when no value matches
 * @param {string} label - Optional label prefix / fallback text
 * @param {React.ReactNode} icon - Optional custom icon
 * @param {boolean} showIcon - Whether to display the leading icon (default true)
 * @param {string} align - Dropdown menu alignment: 'left' | 'right' (default 'left')
 * @param {boolean} fullWidth - Whether dropdown takes 100% width of parent
 * @param {string} size - Size variant: 'default' | 'sm'
 * @param {boolean} disabled - Whether dropdown is disabled
 * @param {string} name - Optional form field name (for form state handlers)
 * @param {string} className - Additional CSS class for container
 * @param {string} triggerClassName - Additional CSS class for trigger button
 * @param {string} menuClassName - Additional CSS class for menu
 * @param {object} style - Inline styles for container
 */
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  onSelect,
  placeholder = "Select...",
  label,
  icon,
  showIcon = true,
  align = "left",
  fullWidth = false,
  size = "default",
  disabled = false,
  name = "",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options array into { value, label, disabled, icon }
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.label,
          label: opt.label !== undefined ? opt.label : String(opt.value),
          disabled: !!opt.disabled,
          icon: opt.icon || null,
        };
      }
      return {
        value: opt,
        label: String(opt),
        disabled: false,
        icon: null,
      };
    });
  }, [options]);

  // Find currently selected option
  const currentOption = useMemo(() => {
    if (value === undefined || value === null) return null;
    return normalizedOptions.find(
      (opt) => String(opt.value) === String(value)
    ) || null;
  }, [normalizedOptions, value]);

  // Compute text to display inside the trigger button
  const currentLabel = useMemo(() => {
    if (currentOption) return currentOption.label;
    if (label) return label;
    return placeholder;
  }, [currentOption, label, placeholder]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    if (option.disabled || disabled) return;
    const selectedVal = option.value !== undefined ? option.value : option;
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { name: name || "", value: selectedVal },
        currentTarget: { name: name || "", value: selectedVal },
        value: selectedVal,
      };
      onChange(syntheticEvent, selectedVal);
    }

    if (onSelect) {
      onSelect(selectedVal, option);
    }
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={dropdownRef}
      style={style}
      className={`${styles.dropdownContainer} ${fullWidth ? styles.fullWidth : ""} ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerOpen : ""} ${
          disabled ? styles.triggerDisabled : ""
        } ${size === "sm" ? styles.sizeSm : ""} ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          {showIcon && (
            <span className={styles.icon}>
              {icon || (
                /* Frontend sort/filter SVG icon from green */
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "100%", height: "100%" }}
                >
                  <line x1="4" y1="6" x2="16" y2="6" />
                  <line x1="4" y1="12" x2="11" y2="12" />
                  <line x1="4" y1="18" x2="8" y2="18" />
                  <polyline points="15 15 18 18 21 15" />
                  <line x1="18" y1="9" x2="18" y2="18" />
                </svg>
              )}
            </span>
          )}

          <span
            className={`${styles.labelText} ${
              !currentOption && placeholder ? styles.placeholder : ""
            }`}
          >
            {currentLabel}
          </span>
        </div>

        {/* Frontend chevron icon with 180-deg flip */}
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animated Dropdown Menu Panel */}
      <div
        className={`${styles.menu} ${isOpen ? styles.menuOpen : ""} ${
          align === "right" ? styles.alignRight : styles.alignLeft
        } ${menuClassName}`}
        role="listbox"
      >
        {normalizedOptions.map((opt, idx) => {
          const isSelected =
            currentOption && String(currentOption.value) === String(opt.value);

          return (
            <button
              key={`${opt.value}-${idx}`}
              type="button"
              role="option"
              disabled={opt.disabled}
              aria-selected={isSelected}
              className={`${styles.menuItem} ${
                isSelected ? styles.menuItemSelected : ""
              }`}
              onClick={() => handleSelect(opt)}
            >
              <div className={styles.itemContent}>
                {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
                <span>{opt.label}</span>
              </div>

              {isSelected && (
                <svg
                  className={styles.checkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
