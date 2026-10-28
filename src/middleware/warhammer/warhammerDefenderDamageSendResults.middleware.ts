import { WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerDefenderDamage.actions";
import getWarhammerDefenderDamageRequestMsg from "../../utils/getWarhammerDefenderDamageRequestMsg";
import { createDamageSendResultsMiddleware } from "./createDamageSendResultsMiddleware";

const warhammerDefenderDamageSendResults = createDamageSendResultsMiddleware(
  WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED,
  getWarhammerDefenderDamageRequestMsg
);

export default warhammerDefenderDamageSendResults;
