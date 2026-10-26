import { Middleware } from "redux";
import { WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerDefenderDamage.actions";
import { requestMsgReady } from "../../actions/roll.actions";
import { WarhammerDefenderDamageResult } from "../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import reducers from "../../reducers";
import getWarhammerDefenderDamageRequestMsg from "../../utils/getWarhammerDefenderDamageRequestMsg";

type RootState = ReturnType<typeof reducers>;

const warhammerDefenderDamageSendResults: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED) {
      return next(action);
    }

    const result = action.payload as WarhammerDefenderDamageResult;
    const nextResult = next(action);

    try {
      const username = store.getState().userSettings.username;
      store.dispatch(
        requestMsgReady(getWarhammerDefenderDamageRequestMsg(result, username))
      );
    } catch (_error) {
      // A notification problem must not turn a successfully saved damage result into a failed calculation.
      console.error("Unable to prepare a Warhammer damage webhook message.");
    }

    return nextResult;
  };

export default warhammerDefenderDamageSendResults;
