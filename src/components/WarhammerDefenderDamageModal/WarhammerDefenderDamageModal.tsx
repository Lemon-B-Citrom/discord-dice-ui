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
            onChange={onChange}
            onCalculate={onCalculate}
            onOpenAdvanced={() => setAdvancedOpen(true)}
            clearCounter={clearCounter}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClear}>
            Clear
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={DEFENDER_DAMAGE_FORM_ID}
          >
            Calculate
          </Button>
        </Modal.Footer>
      </Modal>
      <AdvancedDefenseModal
        show={isAdvancedOpen}
        draft={draft}
        onChange={onChange}
        onClose={() => setAdvancedOpen(false)}
      />
    </>
  );
}

export default WarhammerDefenderDamageModal;
