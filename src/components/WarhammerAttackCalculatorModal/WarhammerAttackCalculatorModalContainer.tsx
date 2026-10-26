import React from "react";
import { connect } from "react-redux";
import { closeWarhammerAttackCalculatorModal } from "../../actions/modals";
import { requestWarhammerAttack } from "../../actions/warhammerAttackCalculator.actions";
import WarhammerAttackCalculatorModal from "./WarhammerAttackCalculatorModal";
import { WarhammerAttackInput } from "./WarhammerAttackCalculatorTypes";

interface WarhammerAttackCalculatorModalContainerProps {
  showModal: boolean;
  closeWarhammerAttackCalculatorModal: () => void;
  onRoll: (input: WarhammerAttackInput) => void;
  calculationError: string;
  initialInput: WarhammerAttackInput | null;
}

const mapStateToProps = (state: any) => ({
  calculationError: state.warhammerAttackCalculator.error,
  initialInput: state.warhammerAttackCalculator.draft,
});

const mapDispatchToProps = {
  closeWarhammerAttackCalculatorModal,
  onRoll: requestWarhammerAttack,
};

function WarhammerAttackCalculatorModalContainer({
  showModal,
  closeWarhammerAttackCalculatorModal,
  onRoll,
  calculationError,
  initialInput,
}: WarhammerAttackCalculatorModalContainerProps) {
  return (
    <WarhammerAttackCalculatorModal
      showModal={showModal}
      closeWarhammerAttackCalculatorModal={closeWarhammerAttackCalculatorModal}
      onRoll={onRoll}
      calculationError={calculationError}
      initialInput={initialInput}
    />
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WarhammerAttackCalculatorModalContainer);
