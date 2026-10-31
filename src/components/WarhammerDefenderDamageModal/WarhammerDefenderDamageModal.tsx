import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import AdvancedDefenseModal from "./AdvancedDefenseModal";
import WarhammerDefenderDamageForm from "./WarhammerDefenderDamageForm";
import styles from "./WarhammerDefenderDamageModal.module.css";
import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";
import { DEFENDER_DAMAGE_FORM_ID } from "./WarhammerDefenderDamageForm";
import parseWarhammerAttackerDamageSummary from "../../utils/parseWarhammerAttackerDamageSummary";
import { isVehicleDamageLocation } from "../../utils/damageLocations";

interface WarhammerDefenderDamageModalProps {
  showModal: boolean;
  closeWarhammerDefenderDamageModal: () => void;
  draft: WarhammerDefenderDamageDraft;
  errors: DefenderDamageValidationErrors;
  onChange: (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => void;
  onCalculate: (draft: WarhammerDefenderDamageDraft) => void;
  onClear: () => void;
  clearCounter: number;
}

function WarhammerDefenderDamageModal({
  showModal,
  closeWarhammerDefenderDamageModal,
  draft,
  errors,
  onChange,
  onCalculate,
  onClear,
  clearCounter,
}: WarhammerDefenderDamageModalProps) {
  // The editor is a sibling of this modal, never a child of its <form>, so its
  // buttons and Enter key cannot submit the calculation.
  const [isAdvancedOpen, setAdvancedOpen] = useState(false);
  // The humanoid editor must not stay open over a vehicle or invalid summary.
  const updateDraft = (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => {
    onChange(field, value);
    if (field !== "attackSummaryString") return;
    const parsed = parseWarhammerAttackerDamageSummary(String(value));
    const humanoid =
      Boolean(parsed.summary) &&
      !isVehicleDamageLocation(parsed.summary?.firstHitLocation || "");
    if (!humanoid) setAdvancedOpen(false);
  };

  const submitDamageForm = () => {
    const form = document.getElementById(
      DEFENDER_DAMAGE_FORM_ID
    ) as HTMLFormElement | null;
    if (!form) return;

    // The Calculate button is outside Modal.Body, where the form is rendered.
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true })
    );
  };

  return (
    <>
      <Modal
        show={showModal}
        onHide={closeWarhammerDefenderDamageModal}
        dialogClassName={styles.dialog}
      >
        <Modal.Header closeButton>
          <Modal.Title>Defender Damage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <WarhammerDefenderDamageForm
            draft={draft}
            errors={errors}
            onChange={updateDraft}
            onCalculate={onCalculate}
            onOpenAdvanced={() => setAdvancedOpen(true)}
            clearCounter={clearCounter}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClear}>
            Clear
          </Button>
          <Button variant="primary" type="button" onClick={submitDamageForm}>
            Calculate
          </Button>
        </Modal.Footer>
      </Modal>
      <AdvancedDefenseModal
        show={isAdvancedOpen}
        draft={draft}
        onChange={updateDraft}
        onClose={() => setAdvancedOpen(false)}
      />
    </>
  );
}

export default WarhammerDefenderDamageModal;
