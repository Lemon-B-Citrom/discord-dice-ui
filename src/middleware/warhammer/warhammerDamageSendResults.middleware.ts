import { Middleware } from "redux";
import { WARHAMMER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerDamageCalculator.actions";
import { requestMsgReady } from "../../actions/roll.actions";
import { WarhammerDamageResult } from "../../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import reducers from "../../reducers";
import getWarhammerDamageRequestMsg from "../../utils/getWarhammerDamageRequestMsg";

type RootState = ReturnType<typeof reducers>;

const warhammerDamageSendResults: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_DAMAGE_RESULTS_SAVED) {
      return next(action);
    }

    const result = action.payload as WarhammerDamageResult;
    const nextResult = next(action);

    try {
      const username =
        store.getState().userSettings.username || "USERNAME_MISSING";
      store.dispatch(
        requestMsgReady(getWarhammerDamageRequestMsg(result, username))
      );
    } catch (_error) {
      console.error("Unable to prepare a Warhammer damage webhook message.");
    }

    return nextResult;
  };

export default warhammerDamageSendResults;
