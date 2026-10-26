import {
  failWarhammerAttack,
  saveWarhammerAttackResults,
  WARHAMMER_ATTACK_REQUESTED,
} from "../../actions/warhammerAttackCalculator.actions";
import { closeWarhammerAttackCalculatorModal } from "../../actions/modals";
import calculateWarhammerAttack from "../../utils/calculateWarhammerAttack";
import {
  WarhammerAttackInput,
  WarhammerAttackResult,
} from "../../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

type CalculateAttack = (
  input: WarhammerAttackInput,
  slType: string
) => WarhammerAttackResult;

export function createWarhammerAttackRollRequestedMiddleware(
  calculateAttack: CalculateAttack = calculateWarhammerAttack
) {
  return (store: any) => (next: any) => (action: any) => {
    if (action.type !== WARHAMMER_ATTACK_REQUESTED) {
      return next(action);
    }

    next(action);

    try {
      const { slType } = store.getState().warhammerState;
      const results = calculateAttack(action.payload, slType);
      store.dispatch(closeWarhammerAttackCalculatorModal());
      store.dispatch(saveWarhammerAttackResults(results));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to calculate this attack";
      store.dispatch(failWarhammerAttack(message));
    }
  };
}

export default createWarhammerAttackRollRequestedMiddleware();
