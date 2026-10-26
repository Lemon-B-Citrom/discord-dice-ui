import React, { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import {
  DAMAGE_LOCATIONS,
  DamageLocation,
} from "./WarhammerDamageCalculatorTypes";
import styles from "./FirstHitLocationSelect.module.css";

const locations = DAMAGE_LOCATIONS;

// Menu row layout: single locations are full width, the limbs pair up. Keyboard
// horizontal navigation is derived from this layout, never from literal indexes.
const ROWS: ReadonlyArray<ReadonlyArray<DamageLocation>> = [
  ["Head"],
  ["Body"],
  ["Left Arm", "Right Arm"],
  ["Left Leg", "Right Leg"],
];

interface FirstHitLocationSelectProps {
  value: string;
  onChange: (value: DamageLocation) => void;
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
      const selectedIndex = locations.findIndex(
        (location) => location === value
      );
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
    const location = locations[index];
    const row =
      ROWS.find((candidate) => candidate.indexOf(location) !== -1) || [location];
    const position = row.indexOf(location);
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = Math.min(index + 1, locations.length - 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(index - 1, 0);
    if (event.key === "ArrowRight" && position < row.length - 1) {
      nextIndex = index + 1;
    }
    if (event.key === "ArrowLeft" && position > 0) {
      nextIndex = index - 1;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = locations.length - 1;

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
      onChange(location);
      setOpen(false);
      toggleRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const renderOption = (location: DamageLocation, index: number) => (
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
        {ROWS.map((row) => (
          <div
            key={row[0]}
            className={row.length === 1 ? styles.fullRow : styles.pairedRow}
          >
            {row.map((location, position) => (
              <React.Fragment key={location}>
                {position > 0 && (
                  <span className={styles.divider} aria-hidden="true">
                    |
                  </span>
                )}
                {renderOption(location, locations.indexOf(location))}
              </React.Fragment>
            ))}
          </div>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default FirstHitLocationSelect;
