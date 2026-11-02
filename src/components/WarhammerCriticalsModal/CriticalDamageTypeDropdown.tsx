import React, { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import { CRITICAL_DAMAGE_TYPES } from "../../utils/WarhammerCustom/criticals/criticalTables";
import {
  CriticalDamageType,
  CriticalLocation,
} from "../../utils/WarhammerCustom/criticals/criticalTypes";
import styles from "./WarhammerCriticalsModal.module.css";

interface CriticalDamageTypeDropdownProps {
  readonly location: CriticalLocation;
  readonly label: string;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly onToggle: (show: boolean) => void;
  readonly onSelect: (damageType: CriticalDamageType) => void;
}

function CriticalDamageTypeDropdown({
  location,
  label,
  selected,
  expanded,
  onToggle,
  onSelect,
}: CriticalDamageTypeDropdownProps) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<
    Partial<Record<CriticalDamageType, HTMLButtonElement | null>>
  >({});
  const [pendingFocus, setPendingFocus] = useState(false);
  const menuId = `warhammer-criticals-${location}-damage-types`;

  useEffect(() => {
    if (!pendingFocus) return;
    if (expanded) optionRefs.current[CRITICAL_DAMAGE_TYPES[0]]?.focus();
    setPendingFocus(false);
  }, [expanded, pendingFocus]);

  const focusType = (index: number) => {
    const boundedIndex = Math.max(
      0,
      Math.min(CRITICAL_DAMAGE_TYPES.length - 1, index)
    );
    optionRefs.current[CRITICAL_DAMAGE_TYPES[boundedIndex]]?.focus();
  };

  const handleToggleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setPendingFocus(true);
    onToggle(true);
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    damageType: CriticalDamageType
  ) => {
    const index = CRITICAL_DAMAGE_TYPES.indexOf(damageType);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onToggle(false);
      toggleRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      onToggle(false);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusType(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusType(CRITICAL_DAMAGE_TYPES.length - 1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusType(index + 1);
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusType(index - 1);
    }
  };

  return (
    <Dropdown
      show={expanded}
      onToggle={onToggle}
      className={styles.locationDropdown}
    >
      <Dropdown.Toggle
        ref={toggleRef}
        id={`warhammer-criticals-${location}-location`}
        variant={selected ? "primary" : "outline-primary"}
        aria-label={label}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={expanded}
        onKeyDown={handleToggleKeyDown}
        className={styles.locationButton}
      >
        {label}
      </Dropdown.Toggle>
      <Dropdown.Menu
        id={menuId}
        renderOnMount
        role="menu"
        aria-hidden={!expanded}
        className={styles.typeMenu}
      >
        {CRITICAL_DAMAGE_TYPES.map((damageType) => (
          <Button
            className={styles.typeButton}
            key={damageType}
            type="button"
            role="menuitem"
            tabIndex={expanded ? undefined : -1}
            variant="outline-secondary"
            ref={(element: HTMLButtonElement | null) => {
              optionRefs.current[damageType] = element;
            }}
            onClick={() => onSelect(damageType)}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) =>
              handleOptionKeyDown(event, damageType)
            }
          >
            {damageType}
          </Button>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default CriticalDamageTypeDropdown;
