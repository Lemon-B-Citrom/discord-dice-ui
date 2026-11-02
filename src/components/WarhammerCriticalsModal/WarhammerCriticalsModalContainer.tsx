import React from "react";
import { connect } from "react-redux";
import { closeWarhammerCriticalsModal } from "../../actions/modals";
import {
  changeWarhammerCriticalDamage,
  requestWarhammerCritical,
  WarhammerCriticalRequestInput,
} from "../../actions/warhammerCriticals.actions";
import { WarhammerCriticalsState } from "../../reducers/warhammer-criticals-reducer";
import {
  CriticalDamageType,
  CriticalFamily,
  CriticalLocation,
} from "../../utils/WarhammerCustom/criticals/criticalTypes";
import WarhammerCriticalsModal from "./WarhammerCriticalsModal";

interface RootState {
  readonly warhammerCriticals: WarhammerCriticalsState;
}

interface Props {
  readonly showModal: boolean;
  readonly damage: string;
  readonly selectedLocation: WarhammerCriticalsState["selectedLocation"];
  readonly errors: WarhammerCriticalsState["errors"];
  readonly closeWarhammerCriticalsModal: typeof closeWarhammerCriticalsModal;
  readonly changeWarhammerCriticalDamage: typeof changeWarhammerCriticalDamage;
  readonly requestWarhammerCritical: typeof requestWarhammerCritical;
}

const mapStateToProps = (state: RootState) => ({
  damage: state.warhammerCriticals.damage,
  selectedLocation: state.warhammerCriticals.selectedLocation,
  errors: state.warhammerCriticals.errors,
});

const mapDispatchToProps = {
  closeWarhammerCriticalsModal,
  changeWarhammerCriticalDamage,
  requestWarhammerCritical,
};

function WarhammerCriticalsModalContainer({
  showModal,
  damage,
  selectedLocation,
  errors,
  closeWarhammerCriticalsModal: onClose,
  changeWarhammerCriticalDamage: onDamageChange,
  requestWarhammerCritical: dispatchRequest,
}: Props) {
  const onRequest = (
    family: CriticalFamily,
    location: CriticalLocation,
    damageType?: CriticalDamageType
  ) => {
    const payload: WarhammerCriticalRequestInput = {
      rawDamage: damage,
      family,
      location,
      ...(damageType ? { damageType } : {}),
    };
    dispatchRequest(payload);
  };

  return (
    <WarhammerCriticalsModal
      showModal={showModal}
      damage={damage}
      selectedLocation={selectedLocation}
      errors={errors}
      onClose={onClose}
      onDamageChange={onDamageChange}
      onRequest={onRequest}
    />
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WarhammerCriticalsModalContainer);
