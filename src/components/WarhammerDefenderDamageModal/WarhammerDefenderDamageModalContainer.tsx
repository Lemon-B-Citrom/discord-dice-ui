import React from "react";
import { connect } from "react-redux";
import { closeWarhammerDefenderDamageModal } from "../../actions/modals";
import {
  clearWarhammerDefenderDamageDraft,
  changeWarhammerDefenderDamageDraft,
  requestWarhammerDefenderDamage,
} from "../../actions/warhammerDefenderDamage.actions";
import { WarhammerDefenderDamageState } from "../../reducers/warhammer-defender-damage-reducer";
import { WarhammerDefenderDamageDraft } from "./WarhammerDefenderDamageTypes";
import WarhammerDefenderDamageModal from "./WarhammerDefenderDamageModal";

interface WarhammerDefenderDamageModalContainerProps {
  showModal: boolean;
  closeWarhammerDefenderDamageModal: () => void;
  draft: WarhammerDefenderDamageDraft;
  errors: WarhammerDefenderDamageState["errors"];
  changeWarhammerDefenderDamageDraft: typeof changeWarhammerDefenderDamageDraft;
  requestWarhammerDefenderDamage: typeof requestWarhammerDefenderDamage;
  clearWarhammerDefenderDamageDraft: typeof clearWarhammerDefenderDamageDraft;
  clearCounter: number;
}

interface RootState {
  warhammerDefenderDamage: WarhammerDefenderDamageState;
}

const mapStateToProps = (state: RootState) => ({
  draft: state.warhammerDefenderDamage.draft,
  errors: state.warhammerDefenderDamage.errors,
  clearCounter: state.warhammerDefenderDamage.clearCounter,
});

const mapDispatchToProps = {
  closeWarhammerDefenderDamageModal,
  changeWarhammerDefenderDamageDraft,
  requestWarhammerDefenderDamage,
  clearWarhammerDefenderDamageDraft,
};

function WarhammerDefenderDamageModalContainer({
  showModal,
  closeWarhammerDefenderDamageModal,
  draft,
  errors,
  changeWarhammerDefenderDamageDraft,
  requestWarhammerDefenderDamage,
  clearWarhammerDefenderDamageDraft,
  clearCounter,
}: WarhammerDefenderDamageModalContainerProps) {
  return (
    <WarhammerDefenderDamageModal
      showModal={showModal}
      closeWarhammerDefenderDamageModal={closeWarhammerDefenderDamageModal}
      draft={draft}
      errors={errors}
      onChange={changeWarhammerDefenderDamageDraft}
      onCalculate={requestWarhammerDefenderDamage}
      onClear={clearWarhammerDefenderDamageDraft}
      clearCounter={clearCounter}
    />
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WarhammerDefenderDamageModalContainer);
