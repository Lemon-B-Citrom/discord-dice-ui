import React from "react";
import { connect } from "react-redux";
import { closeWarhammerAttackerDamageModal } from "../../actions/modals";
import { requestWarhammerAttackerDamage } from "../../actions/warhammerAttackerDamage.actions";
import WarhammerAttackerDamageModal from "./WarhammerAttackerDamageModal";
import { WarhammerAttackerDamageInput } from "./WarhammerAttackerDamageTypes";

interface WarhammerAttackerDamageModalContainerProps {
  showModal: boolean;
  closeWarhammerAttackerDamageModal: () => void;
  onRoll: (input: WarhammerAttackerDamageInput) => void;
  calculationError: string;
  initialInput: WarhammerAttackerDamageInput | null;
}

const mapStateToProps = (state: any) => ({
  calculationError: state.warhammerAttackerDamage.error,
  initialInput: state.warhammerAttackerDamage.draft,
});

const mapDispatchToProps = {
  closeWarhammerAttackerDamageModal,
  onRoll: requestWarhammerAttackerDamage,
};

function WarhammerAttackerDamageModalContainer({
  showModal,
  closeWarhammerAttackerDamageModal,
  onRoll,
  calculationError,
  initialInput,
}: WarhammerAttackerDamageModalContainerProps) {
  return (
    <WarhammerAttackerDamageModal
      showModal={showModal}
      closeWarhammerAttackerDamageModal={closeWarhammerAttackerDamageModal}
      onRoll={onRoll}
      calculationError={calculationError}
      initialInput={initialInput}
    />
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WarhammerAttackerDamageModalContainer);
