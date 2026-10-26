import React, { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import styles from "./FirstHitLocationSelect.module.css";

const locations = [
  "Head",
  "Body",
  "Left Arm",
  "Right Arm",
  "Left Leg",
  "Right Leg",
];

interface FirstHitLocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  ariaDescribedBy?: string;
}

function FirstHitLocationSelect({
  value,
  onChange,
  ariaDescribedBy,
}: FirstHitLocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && pendingFocusIndex !== null) {
      optionRefs.current[pendingFocusIndex]?.focus();
      setPendingFocusIndex(null);
    }
  }, [open, pendingFocusIndex]);

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const handleToggleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const selectedIndex = locations.indexOf(value);
      setPendingFocusIndex(
        selectedIndex >= 0
          ? selectedIndex
          : event.key === "ArrowDown"
          ? 0
          : locations.length - 1
      );
      setOpen(true);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = Math.min(index + 1, 5);
    if (event.key === "ArrowUp") nextIndex = Math.max(index - 1, 0);
    if (event.key === "ArrowRight" && (index === 2 || index === 4)) {
      nextIndex = index + 1;
    }
    if (event.key === "ArrowLeft" && (index === 3 || index === 5)) {
      nextIndex = index - 1;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = 5;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      toggleRef.current?.focus();
    } else if (nextIndex !== undefined) {
      event.preventDefault();
      focusOption(nextIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(locations[index]);
      setOpen(false);
      toggleRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const renderOption = (location: string, index: number) => (
    <Dropdown.Item
      as="button"
      type="button"
      role="menuitemradio"
      aria-checked={value === location}
      key={location}
      className={styles.option}
      active={value === location}
      ref={(element: HTMLButtonElement | null) => {
        optionRefs.current[index] = element;
      }}
      onClick={() => {
        onChange(location);
        setOpen(false);
        toggleRef.current?.focus();
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) =>
        handleOptionKeyDown(event, index)
      }
    >
      {location}
    </Dropdown.Item>
  );

  return (
    <Dropdown show={open} onToggle={(show) => setOpen(show)}>
      <Dropdown.Toggle
        ref={toggleRef}
        id="damage-calculator-first-hit-location"
        variant="outline-secondary"
        aria-label={value ? `First Hit Location: ${value}` : "First Hit Location"}
        aria-haspopup="menu"
        aria-controls="damage-calculator-first-hit-location-menu"
        aria-expanded={open}
        aria-describedby={ariaDescribedBy}
        aria-invalid={Boolean(ariaDescribedBy)}
        onKeyDown={handleToggleKeyDown}
        className={`${styles.toggle} ${ariaDescribedBy ? "border-danger" : ""}`}
      >
        {value || "First Hit Location"}
      </Dropdown.Toggle>
      <Dropdown.Menu
        id="damage-calculator-first-hit-location-menu"
        role="menu"
        aria-label="First Hit Location options"
        className={styles.menu}
      >
        <div className={styles.fullRow}>{renderOption("Head", 0)}</div>
        <div className={styles.fullRow}>{renderOption("Body", 1)}</div>
        <div className={styles.pairedRow}>
          {renderOption("Left Arm", 2)}
          <span className={styles.divider} aria-hidden="true">
            |
          </span>
          {renderOption("Right Arm", 3)}
        </div>
        <div className={styles.pairedRow}>
          {renderOption("Left Leg", 4)}
          <span className={styles.divider} aria-hidden="true">
            |
          </span>
          {renderOption("Right Leg", 5)}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default FirstHitLocationSelect;
