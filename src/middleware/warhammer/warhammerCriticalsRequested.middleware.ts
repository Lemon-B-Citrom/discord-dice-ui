import { Middleware } from "redux";
import {
  failWarhammerCritical,
  saveWarhammerCriticalResults,
  selectWarhammerCriticalLocation,
  WARHAMMER_CRITICAL_REQUESTED,
  WarhammerCriticalRequestInput,
} from "../../actions/warhammerCriticals.actions";
import reducers from "../../reducers";
import { lookupWarhammerCritical } from "../../utils/WarhammerCustom/criticals/lookupWarhammerCritical";
import { normalizeWarhammerCritical } from "../../utils/WarhammerCustom/criticals/normalizeWarhammerCritical";
import { WarhammerCriticalRequest } from "../../utils/WarhammerCustom/criticals/criticalTypes";
import {
  resolveWarhammerCriticalResult,
  RollDie,
} from "../../utils/WarhammerCustom/criticals/resolveWarhammerCritical";

type RootState = ReturnType<typeof reducers>;
type Lookup = (request: WarhammerCriticalRequest) => ReturnType<typeof lookupWarhammerCritical>;

export function createWarhammerCriticalsRequestedMiddleware(
  lookup: Lookup = lookupWarhammerCritical,
  rollDie?: RollDie
): Middleware<{}, RootState> {
  return (store) => (next) => (action: any) => {
    if (action.type !== WARHAMMER_CRITICAL_REQUESTED) return next(action);

    const nextResult = next(action);
    const input = action.payload as WarhammerCriticalRequestInput;

    // A valid humanoid location opens a second-stage type selector. It is not
    // a lookup request and must not save results or notify the webhook.
    if (
      input &&
      input.family === "humanoid" &&
      input.damageType === undefined &&
      ["head", "body", "arm", "leg"].indexOf(input.location) >= 0
    ) {
      const validation = normalizeWarhammerCritical(
        input.rawDamage,
        "humanoid",
        input.location as any,
        "Energy"
      );
      if (!validation.request) {
        store.dispatch(failWarhammerCritical(validation.errors));
      } else {
        store.dispatch(
          selectWarhammerCriticalLocation({
            family: "humanoid",
            location: input.location,
          })
        );
      }
      return nextResult;
    }

    try {
      const normalized = input
        ? normalizeWarhammerCritical(
            input.rawDamage,
            input.family,
            input.location,
            input.damageType
          )
        : { request: null, errors: { form: "Critical selection is invalid" } };
      if (!normalized.request) {
        store.dispatch(failWarhammerCritical(normalized.errors));
        return nextResult;
      }
      store.dispatch(
        saveWarhammerCriticalResults(
          resolveWarhammerCriticalResult(lookup(normalized.request), rollDie)
        )
      );
    } catch (error) {
      store.dispatch(
        failWarhammerCritical({
          form:
            error instanceof Error
              ? error.message
              : "Unable to find this critical effect",
        })
      );
    }
    return nextResult;
  };
}

export default createWarhammerCriticalsRequestedMiddleware();
