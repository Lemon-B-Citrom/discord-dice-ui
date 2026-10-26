import { Middleware } from "redux";
import {
  failWarhammerDamage,
  saveWarhammerDamageResults,
  WARHAMMER_DAMAGE_REQUESTED,
} from "../../actions/warhammerDamageCalculator.actions";
import { WarhammerDamageDraft } from "../../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import calculateWarhammerDamage from "../../utils/calculateWarhammerDamage";
import normalizeWarhammerDamage from "../../utils/normalizeWarhammerDamage";

type CalculateDamage = ReturnType<typeof calculateWarhammerDamage>;
type DamageCalculator = (
  draft: WarhammerDamageDraft,
  request: NonNullable<ReturnType<typeof normalizeWarhammerDamage>["request"]>
) => CalculateDamage;

export function createWarhammerDamageCalculationRequestedMiddleware(
  calculate: DamageCalculator = calculateWarhammerDamage
): Middleware<{}, any> {
  return (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_DAMAGE_REQUESTED) return next(action);

    next(action);
    const draft = action.payload as WarhammerDamageDraft;
    const normalized = normalizeWarhammerDamage(draft);
    if (!normalized.request) {
      store.dispatch(failWarhammerDamage(normalized.errors));
      return action;
    }

    try {
      store.dispatch(
        saveWarhammerDamageResults(calculate(draft, normalized.request))
      );
    } catch (error) {
      store.dispatch(
        failWarhammerDamage({
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

export default createWarhammerDamageCalculationRequestedMiddleware();
