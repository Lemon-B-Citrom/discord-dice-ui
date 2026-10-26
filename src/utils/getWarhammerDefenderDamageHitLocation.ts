import { DamageLocation } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

const locationCycles: Record<DamageLocation, readonly DamageLocation[]> = {
  Head: ["Head", "Right Arm", "Body", "Left Arm", "Body", "Head"],
  "Right Arm": ["Right Arm", "Body", "Head", "Left Arm", "Body", "Head"],
  "Left Arm": ["Left Arm", "Body", "Head", "Right Arm", "Body", "Head"],
  Body: ["Body", "Left Leg", "Right Arm", "Body", "Right Leg", "Left Arm"],
  "Right Leg": ["Right Leg", "Body", "Left Leg", "Body", "Right Leg", "Body"],
  "Left Leg": ["Left Leg", "Body", "Right Leg", "Body", "Left Leg", "Body"],
};

export default function getWarhammerDefenderDamageHitLocation(
  firstLocation: DamageLocation,
  hitIndex: number
): DamageLocation {
  const cycle = locationCycles[firstLocation];
  return cycle[((hitIndex % cycle.length) + cycle.length) % cycle.length];
}
