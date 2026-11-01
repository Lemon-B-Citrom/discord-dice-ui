import {
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import getResultsArray from "../../getResultsArray";
import { calculateHumanoidDefenderDamage } from "./calculateHumanoidDefenderDamage";
import { calculateVehicleDefenderDamage } from "./calculateVehicleDefenderDamage";
import { validateWarhammerDefenderDamageResult } from "./validateWarhammerDefenderDamageResult";

/** Dispatch a validated request to the matching defender-damage calculation. */
export function calculateWarhammerDefenderDamage(
  request: WarhammerDefenderDamageRequest,
  rollD100: () => number = () => getResultsArray(100)[0]
): WarhammerDefenderDamageResult {
  const result =
    request.targetFamily === "vehicle"
      ? calculateVehicleDefenderDamage(request, rollD100)
      : calculateHumanoidDefenderDamage(request);
  return validateWarhammerDefenderDamageResult(result);
}
