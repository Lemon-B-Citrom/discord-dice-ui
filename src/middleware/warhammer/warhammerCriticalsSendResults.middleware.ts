import {
  warnWarhammerCriticalSend,
  WARHAMMER_CRITICAL_RESULTS_SAVED,
} from "../../actions/warhammerCriticals.actions";
import { getWarhammerCriticalRequestMsg } from "../../utils/WarhammerCustom/criticals/getWarhammerCriticalRequestMsg";
import { createDamageSendResultsMiddleware } from "./createDamageSendResultsMiddleware";

export const warhammerCriticalsSendResults = createDamageSendResultsMiddleware(
  WARHAMMER_CRITICAL_RESULTS_SAVED,
  getWarhammerCriticalRequestMsg,
  (store) =>
    store.dispatch(
      warnWarhammerCriticalSend(
        "The result is shown here, but its webhook message could not be prepared."
      )
    )
);

export default warhammerCriticalsSendResults;
