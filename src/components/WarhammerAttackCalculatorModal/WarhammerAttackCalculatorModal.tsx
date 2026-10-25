import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import WarhammerAttackCalculatorForm from "./WarhammerAttackCalculatorForm";
import styles from "./WarhammerAttackCalculatorModal.module.css";

interface WarhammerAttackCalculatorModalProps {
  showModal: boolean;
  closeWarhammerAttackCalculatorModal: () => void;
}

function WarhammerAttackCalculatorModal({
  showModal,
  closeWarhammerAttackCalculatorModal,
}: WarhammerAttackCalculatorModalProps) {
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
        <WarhammerAttackCalculatorForm />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" disabled>
          Roll
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerAttackCalculatorModal;
