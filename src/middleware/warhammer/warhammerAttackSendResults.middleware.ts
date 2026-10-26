import { Middleware } from "redux";
import { WARHAMMER_ATTACK_RESULTS_SAVED } from "../../actions/warhammerAttackCalculator.actions";
import { requestMsgReady } from "../../actions/roll.actions";
import { WarhammerAttackResult } from "../../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";
import reducers from "../../reducers";
import getWarhammerAttackRequestMsg from "../../utils/getWarhammerAttackRequestMsg";

type RootState = ReturnType<typeof reducers>;

const warhammerAttackSendResults: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_ATTACK_RESULTS_SAVED) {
      return next(action);
    }

    const result = action.payload as WarhammerAttackResult;
    const nextResult = next(action);

    try {
      const username =
        store.getState().userSettings.username || "USERNAME_MISSING";
      store.dispatch(
        requestMsgReady(getWarhammerAttackRequestMsg(result, username))
      );
    } catch (_error) {
      // A notification problem must not turn a successfully saved attack into a failed calculation.
      console.error("Unable to prepare a Warhammer attack webhook message.");
    }

    return nextResult;
  };

export default warhammerAttackSendResults;
