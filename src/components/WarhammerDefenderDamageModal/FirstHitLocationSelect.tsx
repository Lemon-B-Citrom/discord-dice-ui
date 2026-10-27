import React, { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import {
  DAMAGE_LOCATION_READING_ORDER,
  DAMAGE_LOCATION_ROWS,
  DAMAGE_LOCATION_SHORT_LABELS,
  getAdjacentLocation,
  MenuMoveKey,
} from "../../utils/damageLocations";
import { DamageLocation } from "./WarhammerDefenderDamageTypes";
import styles from "./FirstHitLocationSelect.module.css";

const MENU_MOVE_KEYS: ReadonlyArray<MenuMoveKey> = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
];

const isMenuMoveKey = (key: string): key is MenuMoveKey =>
  MENU_MOVE_KEYS.indexOf(key as MenuMoveKey) !== -1;

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
  const [pendingFocus, setPendingFocus] = useState<DamageLocation | null>(null);
  const optionRefs = useRef<
    Partial<Record<DamageLocation, HTMLButtonElement | null>>
  >({});
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && pendingFocus) {
      optionRefs.current[pendingFocus]?.focus();
      setPendingFocus(null);
    }
  }, [open, pendingFocus]);

  const focusOption = (location: DamageLocation) => {
    optionRefs.current[location]?.focus();
  };

  const closeMenu = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const select = (location: DamageLocation) => {
    onChange(location);
    closeMenu();
  };

  const selectedLocation =
    DAMAGE_LOCATION_READING_ORDER.find((location) => location === value) || null;

  const handleToggleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    // Both keys open the menu on the current choice, or on Head when empty.
    setPendingFocus(selectedLocation || DAMAGE_LOCATION_READING_ORDER[0]);
    setOpen(true);
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    location: DamageLocation
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(location);
      return;
    }
    if (event.key === "Tab") {
      // Let the browser continue the tab order after the menu has closed.
      setOpen(false);
      return;
    }
    if (!isMenuMoveKey(event.key)) return;
    const nextLocation = getAdjacentLocation(location, event.key);
    if (nextLocation) {
      event.preventDefault();
      focusOption(nextLocation);
    }
  };

  return (
    <Dropdown show={open} onToggle={(show) => setOpen(show)}>
      <Dropdown.Toggle
        ref={toggleRef}
        id="defender-damage-first-hit-location"
        variant="outline-secondary"
        aria-label={value ? `First Hit Location: ${value}` : "First Hit Location"}
        aria-haspopup="menu"
        aria-controls="defender-damage-first-hit-location-menu"
        aria-expanded={open}
        aria-describedby={ariaDescribedBy}
        aria-invalid={Boolean(ariaDescribedBy)}
        onKeyDown={handleToggleKeyDown}
        className={`${styles.toggle} ${ariaDescribedBy ? "border-danger" : ""}`}
      >
        {value || "First Hit Location"}
      </Dropdown.Toggle>
      <Dropdown.Menu
        id="defender-damage-first-hit-location-menu"
        role="menu"
        aria-label="First Hit Location options"
        className={styles.menu}
      >
        {DAMAGE_LOCATION_ROWS.map((row) => (
          <div key={row[0]} className={styles.optionRow} role="none">
            {row.map((location) => (
              <Button
                key={location}
                type="button"
                role="menuitemradio"
                aria-checked={value === location}
                aria-label={location}
                variant="outline-secondary"
                active={value === location}
                className={styles.option}
                ref={(element: HTMLButtonElement | null) => {
                  optionRefs.current[location] = element;
                }}
                onClick={() => select(location)}
                onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) =>
                  handleOptionKeyDown(event, location)
                }
              >
                {DAMAGE_LOCATION_SHORT_LABELS[location]}
              </Button>
            ))}
          </div>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default FirstHitLocationSelect;
