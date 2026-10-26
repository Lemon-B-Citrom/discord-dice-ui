import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import WarhammerDamageCalculatorForm from "./WarhammerDamageCalculatorForm";
import styles from "./WarhammerDamageCalculatorModal.module.css";
import {
  DamageValidationErrors,
  WarhammerDamageDraft,
} from "./WarhammerDamageCalculatorTypes";
import { DAMAGE_CALCULATOR_FORM_ID } from "./WarhammerDamageCalculatorForm";

interface WarhammerDamageCalculatorModalProps {
  showModal: boolean;
  closeWarhammerDamageCalculatorModal: () => void;
  draft: WarhammerDamageDraft;
  errors: DamageValidationErrors;
  onChange: (field: keyof WarhammerDamageDraft, value: string) => void;
  onCalculate: (draft: WarhammerDamageDraft) => void;
  onClear: () => void;
  clearCounter: number;
}

function WarhammerDamageCalculatorModal({
  showModal,
  closeWarhammerDamageCalculatorModal,
  draft,
  errors,
  onChange,
  onCalculate,
  onClear,
  clearCounter,
}: WarhammerDamageCalculatorModalProps) {
  return (
    <Modal
      show={showModal}
      onHide={closeWarhammerDamageCalculatorModal}
      dialogClassName={styles.dialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>Damage Calculator</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WarhammerDamageCalculatorForm
          draft={draft}
          errors={errors}
          onChange={onChange}
          onCalculate={onCalculate}
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
          form={DAMAGE_CALCULATOR_FORM_ID}
        >
          Calculate
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerDamageCalculatorModal;
