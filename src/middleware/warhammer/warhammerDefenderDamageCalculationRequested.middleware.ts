import { Middleware } from "redux";
import {
  failWarhammerDefenderDamage,
  saveWarhammerDefenderDamageResults,
  WARHAMMER_DEFENDER_DAMAGE_REQUESTED,
} from "../../actions/warhammerDefenderDamage.actions";
import { WarhammerDefenderDamageDraft } from "../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import calculateWarhammerDefenderDamage from "../../utils/calculateWarhammerDefenderDamage";
import normalizeWarhammerDefenderDamage from "../../utils/normalizeWarhammerDefenderDamage";

type CalculateDamage = ReturnType<typeof calculateWarhammerDefenderDamage>;
type DefenderDamage = (
  draft: WarhammerDefenderDamageDraft,
  request: NonNullable<ReturnType<typeof normalizeWarhammerDefenderDamage>["request"]>
) => CalculateDamage;

export function createWarhammerDefenderDamageCalculationRequestedMiddleware(
  calculate: DefenderDamage = calculateWarhammerDefenderDamage
): Middleware<{}, any> {
  return (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_DEFENDER_DAMAGE_REQUESTED) return next(action);

    next(action);
    const draft = action.payload as WarhammerDefenderDamageDraft;
    const normalized = normalizeWarhammerDefenderDamage(draft);
    if (!normalized.request) {
      store.dispatch(failWarhammerDefenderDamage(normalized.errors));
      return action;
    }

    try {
      store.dispatch(
        saveWarhammerDefenderDamageResults(calculate(draft, normalized.request))
      );
    } catch (error) {
      store.dispatch(
        failWarhammerDefenderDamage({
          form:
            error instanceof Error
              ? error.message
              : "Unable to calculate this damage",
        })
      );
    }
    return action;
  };
}

export default createWarhammerDefenderDamageCalculationRequestedMiddleware();
