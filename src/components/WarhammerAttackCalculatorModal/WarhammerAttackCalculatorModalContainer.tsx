import React from "react";
import { connect } from "react-redux";
import { closeWarhammerAttackCalculatorModal } from "../../actions/modals";
import WarhammerAttackCalculatorModal from "./WarhammerAttackCalculatorModal";

interface WarhammerAttackCalculatorModalContainerProps {
  showModal: boolean;
  closeWarhammerAttackCalculatorModal: () => void;
}

const mapDispatchToProps = {
  closeWarhammerAttackCalculatorModal,
};

function WarhammerAttackCalculatorModalContainer({
  showModal,
  closeWarhammerAttackCalculatorModal,
}: WarhammerAttackCalculatorModalContainerProps) {
  return (
    <WarhammerAttackCalculatorModal
      showModal={showModal}
      closeWarhammerAttackCalculatorModal={closeWarhammerAttackCalculatorModal}
    />
  );
}

export default connect(
  undefined,
  mapDispatchToProps
)(WarhammerAttackCalculatorModalContainer);
