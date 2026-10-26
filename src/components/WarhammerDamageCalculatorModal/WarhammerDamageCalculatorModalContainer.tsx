import React from "react";
import { connect } from "react-redux";
import { closeWarhammerDamageCalculatorModal } from "../../actions/modals";
import {
  clearWarhammerDamageDraft,
  changeWarhammerDamageDraft,
  requestWarhammerDamage,
} from "../../actions/warhammerDamageCalculator.actions";
import { WarhammerDamageCalculatorState } from "../../reducers/warhammer-damage-calculator-reducer";
import { WarhammerDamageDraft } from "./WarhammerDamageCalculatorTypes";
import WarhammerDamageCalculatorModal from "./WarhammerDamageCalculatorModal";

interface WarhammerDamageCalculatorModalContainerProps {
  showModal: boolean;
  closeWarhammerDamageCalculatorModal: () => void;
  draft: WarhammerDamageDraft;
  errors: WarhammerDamageCalculatorState["errors"];
  changeWarhammerDamageDraft: typeof changeWarhammerDamageDraft;
  requestWarhammerDamage: typeof requestWarhammerDamage;
  clearWarhammerDamageDraft: typeof clearWarhammerDamageDraft;
  clearCounter: number;
}

interface RootState {
  warhammerDamageCalculator: WarhammerDamageCalculatorState;
}

const mapStateToProps = (state: RootState) => ({
  draft: state.warhammerDamageCalculator.draft,
  errors: state.warhammerDamageCalculator.errors,
  clearCounter: state.warhammerDamageCalculator.clearCounter,
});

const mapDispatchToProps = {
  closeWarhammerDamageCalculatorModal,
  changeWarhammerDamageDraft,
  requestWarhammerDamage,
  clearWarhammerDamageDraft,
};

function WarhammerDamageCalculatorModalContainer({
  showModal,
  closeWarhammerDamageCalculatorModal,
  draft,
  errors,
  changeWarhammerDamageDraft,
  requestWarhammerDamage,
  clearWarhammerDamageDraft,
  clearCounter,
}: WarhammerDamageCalculatorModalContainerProps) {
  return (
    <WarhammerDamageCalculatorModal
      showModal={showModal}
      closeWarhammerDamageCalculatorModal={closeWarhammerDamageCalculatorModal}
      draft={draft}
      errors={errors}
      onChange={changeWarhammerDamageDraft}
      onCalculate={requestWarhammerDamage}
      onClear={clearWarhammerDamageDraft}
      clearCounter={clearCounter}
    />
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WarhammerDamageCalculatorModalContainer);
