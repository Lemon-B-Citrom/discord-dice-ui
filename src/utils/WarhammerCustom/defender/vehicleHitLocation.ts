import { VehicleDamageLocation } from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

/** Resolve the Liber Imperium vehicle table's 0–99 roll. */
export function getVehicleHitLocation(
  roll: number
): VehicleDamageLocation | undefined {
  if (roll >= 1 && roll <= 20) return "Motive Systems";
  if (roll >= 21 && roll <= 60) return "Hull";
  if (roll >= 61 && roll <= 80) return "Weapons";
  if ((roll >= 81 && roll <= 99) || roll === 0) return "Turret";
  return undefined;
}
