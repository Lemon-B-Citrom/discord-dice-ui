import { WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED } from "../../actions/warhammerAttackerDamage.actions";
import { failWarhammerAttackerDamage } from "../../actions/warhammerAttackerDamage.actions";
import getWarhammerAttackerDamageRequestMsg from "../../utils/getWarhammerAttackerDamageRequestMsg";
import { createDamageSendResultsMiddleware } from "./createDamageSendResultsMiddleware";

const warhammerAttackerDamageSendResults = createDamageSendResultsMiddleware(
  WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED,
  getWarhammerAttackerDamageRequestMsg,
  (store) =>
    store.dispatch(
      failWarhammerAttackerDamage(
        "The attack summary is too large to send to Discord. Local results and Copy are still available; reduce the number of hits or simplify the summary, then calculate again."
      )
    )
);

export default warhammerAttackerDamageSendResults;
