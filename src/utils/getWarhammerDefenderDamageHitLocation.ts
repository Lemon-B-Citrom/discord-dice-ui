import { DamageLocation } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { HIT_LOCATION_CYCLES } from "./damageLocations";

export default function getWarhammerDefenderDamageHitLocation(
  firstLocation: DamageLocation,
  hitIndex: number
): DamageLocation {
  const cycle = HIT_LOCATION_CYCLES[firstLocation];
  return cycle[hitIndex % cycle.length];
}
