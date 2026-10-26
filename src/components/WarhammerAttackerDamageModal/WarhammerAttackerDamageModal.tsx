import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import WarhammerAttackerDamageForm, {
  FORM_ID,
} from "./WarhammerAttackerDamageForm";
import styles from "./WarhammerAttackerDamageModal.module.css";
import { WarhammerAttackerDamageInput } from "./WarhammerAttackerDamageTypes";

interface WarhammerAttackerDamageModalProps {
  showModal: boolean;
  closeWarhammerAttackerDamageModal: () => void;
  onRoll: (input: WarhammerAttackerDamageInput) => void;
  calculationError?: string;
  initialInput?: WarhammerAttackerDamageInput | null;
}

function WarhammerAttackerDamageModal({
  showModal,
  closeWarhammerAttackerDamageModal,
  onRoll,
  calculationError,
  initialInput,
}: WarhammerAttackerDamageModalProps) {
  const [resetCounter, setResetCounter] = useState(0);

  return (
    <Modal
      show={showModal}
      onHide={closeWarhammerAttackerDamageModal}
      dialogClassName={styles.dialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>Attacker Damage</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WarhammerAttackerDamageForm
          onRoll={onRoll}
          calculationError={calculationError}
          initialInput={initialInput}
          resetCounter={resetCounter}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          type="button"
          onClick={() => setResetCounter((counter) => counter + 1)}
        >
          Clear
        </Button>
        <Button variant="primary" type="submit" form={FORM_ID}>
          Roll
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerAttackerDamageModal;
