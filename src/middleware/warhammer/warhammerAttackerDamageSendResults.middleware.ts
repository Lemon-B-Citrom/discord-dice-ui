import { WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerAttackerDamage.actions";
import getWarhammerAttackerDamageRequestMsg from "../../utils/getWarhammerAttackerDamageRequestMsg";
import { createDamageSendResultsMiddleware } from "./createDamageSendResultsMiddleware";

const warhammerAttackerDamageSendResults = createDamageSendResultsMiddleware(
  WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED,
  getWarhammerAttackerDamageRequestMsg
);

export default warhammerAttackerDamageSendResults;
