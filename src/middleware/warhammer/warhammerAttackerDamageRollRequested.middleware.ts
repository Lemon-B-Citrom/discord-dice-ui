import { Middleware } from "redux";
import {
  failWarhammerAttackerDamage,
  saveWarhammerAttackerDamageResults,
  WARHAMMER_ATTACKER_DAMAGE_REQUESTED,
} from "../../actions/warhammerAttackerDamage.actions";
import { closeWarhammerAttackerDamageModal } from "../../actions/modals";
import {
  WarhammerAttackerDamageInput,
  WarhammerAttackerDamageResult,
} from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import reducers from "../../reducers";
import calculateWarhammerAttackerDamage from "../../utils/calculateWarhammerAttackerDamage";

type RootState = ReturnType<typeof reducers>;

type CalculateAttack = (
  input: WarhammerAttackerDamageInput,
  slType: string
) => WarhammerAttackerDamageResult;

export function createWarhammerAttackerDamageRollRequestedMiddleware(
  calculateAttack: CalculateAttack = calculateWarhammerAttackerDamage
): Middleware<{}, RootState> {
  return (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_ATTACKER_DAMAGE_REQUESTED) {
      return next(action);
    }

    const nextResult = next(action);

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

    return nextResult;
  };
}

export default createWarhammerAttackerDamageRollRequestedMiddleware();
