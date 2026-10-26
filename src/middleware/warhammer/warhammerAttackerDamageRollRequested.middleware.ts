import {
  failWarhammerAttackerDamage,
  saveWarhammerAttackerDamageResults,
  WARHAMMER_ATTACKER_DAMAGE_REQUESTED,
} from "../../actions/warhammerAttackerDamage.actions";
import { closeWarhammerAttackerDamageModal } from "../../actions/modals";
import calculateWarhammerAttackerDamage from "../../utils/calculateWarhammerAttackerDamage";
import {
  WarhammerAttackerDamageInput,
  WarhammerAttackerDamageResult,
} from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

type CalculateAttack = (
  input: WarhammerAttackerDamageInput,
  slType: string
) => WarhammerAttackerDamageResult;

export function createWarhammerAttackerDamageRollRequestedMiddleware(
  calculateAttack: CalculateAttack = calculateWarhammerAttackerDamage
) {
  return (store: any) => (next: any) => (action: any) => {
    if (action.type !== WARHAMMER_ATTACKER_DAMAGE_REQUESTED) {
      return next(action);
    }

    next(action);

    try {
      const { slType } = store.getState().warhammerState;
      const results = calculateAttack(action.payload, slType);
      store.dispatch(closeWarhammerAttackerDamageModal());
      store.dispatch(saveWarhammerAttackerDamageResults(results));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to calculate this attack";
      store.dispatch(failWarhammerAttackerDamage(message));
    }
  };
}

export default createWarhammerAttackerDamageRollRequestedMiddleware();
