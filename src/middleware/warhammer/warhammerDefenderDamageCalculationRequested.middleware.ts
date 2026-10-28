import { Middleware } from "redux";
import {
  failWarhammerDefenderDamage,
  saveWarhammerDefenderDamageResults,
  WARHAMMER_DEFENDER_DAMAGE_REQUESTED,
} from "../../actions/warhammerDefenderDamage.actions";
import { WarhammerDefenderDamageDraft } from "../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import reducers from "../../reducers";
import calculateWarhammerDefenderDamage from "../../utils/calculateWarhammerDefenderDamage";
import normalizeWarhammerDefenderDamage from "../../utils/normalizeWarhammerDefenderDamage";

type RootState = ReturnType<typeof reducers>;
type CalculateDamage = ReturnType<typeof calculateWarhammerDefenderDamage>;
type DefenderDamage = (
  request: Parameters<typeof calculateWarhammerDefenderDamage>[0]
) => CalculateDamage;

export function createWarhammerDefenderDamageCalculationRequestedMiddleware(
  calculate: DefenderDamage = calculateWarhammerDefenderDamage
): Middleware<{}, RootState> {
  return (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_DEFENDER_DAMAGE_REQUESTED) {
      return next(action);
    }

    const nextResult = next(action);
    const draft = action.payload as WarhammerDefenderDamageDraft;
    const normalized = normalizeWarhammerDefenderDamage(draft);
    if (!normalized.request) {
      store.dispatch(failWarhammerDefenderDamage(normalized.errors));
      return nextResult;
    }

    try {
      store.dispatch(
        saveWarhammerDefenderDamageResults(calculate(normalized.request))
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
    return nextResult;
  };
}

export default createWarhammerDefenderDamageCalculationRequestedMiddleware();
