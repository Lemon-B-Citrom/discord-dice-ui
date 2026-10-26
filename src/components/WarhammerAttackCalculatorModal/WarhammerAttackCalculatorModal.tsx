import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import WarhammerAttackCalculatorForm, {
  FORM_ID,
} from "./WarhammerAttackCalculatorForm";
import styles from "./WarhammerAttackCalculatorModal.module.css";
import { WarhammerAttackInput } from "./WarhammerAttackCalculatorTypes";

interface WarhammerAttackCalculatorModalProps {
  showModal: boolean;
  closeWarhammerAttackCalculatorModal: () => void;
  onRoll: (input: WarhammerAttackInput) => void;
  calculationError?: string;
  initialInput?: WarhammerAttackInput | null;
}

function WarhammerAttackCalculatorModal({
  showModal,
  closeWarhammerAttackCalculatorModal,
  onRoll,
  calculationError,
  initialInput,
}: WarhammerAttackCalculatorModalProps) {
  const [resetCounter, setResetCounter] = useState(0);

  return (
    <Modal
      show={showModal}
      onHide={closeWarhammerAttackCalculatorModal}
      dialogClassName={styles.dialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>Attack Calculator</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WarhammerAttackCalculatorForm
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

export default WarhammerAttackCalculatorModal;
