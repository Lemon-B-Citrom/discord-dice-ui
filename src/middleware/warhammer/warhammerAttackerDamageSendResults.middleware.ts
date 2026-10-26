import { Middleware } from "redux";
import { WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerAttackerDamage.actions";
import { requestMsgReady } from "../../actions/roll.actions";
import { WarhammerAttackerDamageResult } from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import reducers from "../../reducers";
import getWarhammerAttackerDamageRequestMsg from "../../utils/getWarhammerAttackerDamageRequestMsg";

type RootState = ReturnType<typeof reducers>;

const warhammerAttackerDamageSendResults: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED) {
      return next(action);
    }

    const result = action.payload as WarhammerAttackerDamageResult;
    const nextResult = next(action);

    try {
      const username = store.getState().userSettings.username;
      store.dispatch(
        requestMsgReady(getWarhammerAttackerDamageRequestMsg(result, username))
      );
    } catch (_error) {
      // A notification problem must not turn a successfully saved attack into a failed calculation.
      console.error("Unable to prepare a Warhammer attack webhook message.");
    }

    return nextResult;
  };

export default warhammerAttackerDamageSendResults;
