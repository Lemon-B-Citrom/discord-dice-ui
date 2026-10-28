import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import normalizeAdvancedDefenses, {
  ADVANCED_DEFENSE_FIELD_KEYS,
} from "../../utils/advancedDefenses";
import AdvancedDefensePanel from "./AdvancedDefensePanel";
import styles from "./AdvancedDefenseModal.module.css";
import { WarhammerDefenderDamageDraft } from "./WarhammerDefenderDamageTypes";

export const ADVANCED_DEFENSE_TITLE_ID = "advanced-defense-title";

// The Defender modal sits at Bootstrap's 1050. The editor and its backdrop are
// lifted above it so the whole screen, including that modal, dims behind it.
const EDITOR_Z_INDEX = 1070;
const EDITOR_BACKDROP_Z_INDEX = 1060;

interface AdvancedDefenseModalProps {
  show: boolean;
  draft: WarhammerDefenderDamageDraft;
  onChange: (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => void;
  onClose: () => void;
}

function AdvancedDefenseModal({
  show,
  draft,
  onChange,
  onClose,
}: AdvancedDefenseModalProps) {
  // The editor reports its own errors even before the box is ticked, so a value
  // is never silently ignored or silently invalid.
  const errors = normalizeAdvancedDefenses(draft, true).errors;
  const hasErrors = ADVANCED_DEFENSE_FIELD_KEYS.some((field) =>
    Boolean(errors[field])
  );
  const clearAll = () => {
    ADVANCED_DEFENSE_FIELD_KEYS.forEach((field) => onChange(field, ""));
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      dialogClassName={styles.dialog}
      backdropClassName={styles.backdrop}
      style={{ zIndex: EDITOR_Z_INDEX }}
      aria-labelledby={ADVANCED_DEFENSE_TITLE_ID}
    >
      <Modal.Header closeButton>
        <Modal.Title id={ADVANCED_DEFENSE_TITLE_ID}>Advanced Defenses</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.panels}>
          <AdvancedDefensePanel
            kind="armor"
            heading="Armor"
            description="Sets armor for specific bodyparts"
            draft={draft}
            errors={errors}
            onChange={onChange}
          />
          <AdvancedDefensePanel
            kind="toughness"
            heading="+Toughness"
            description="Adds to base TB for specific bodyparts"
            draft={draft}
            errors={errors}
            onChange={onChange}
          />
        </div>
      </Modal.Body>
      <Modal.Footer className={styles.footer}>
        <Button variant="outline-secondary" type="button" onClick={clearAll}>
          Clear
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={onClose}
          disabled={hasErrors}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AdvancedDefenseModal;
