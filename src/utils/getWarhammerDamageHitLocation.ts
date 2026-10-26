import { DamageLocation } from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";

const locationCycles: Record<DamageLocation, DamageLocation[]> = {
  Head: ["Head", "Right Arm", "Body", "Left Arm", "Body", "Head"],
  "Right Arm": ["Right Arm", "Body", "Head", "Left Arm", "Body", "Head"],
  "Left Arm": ["Left Arm", "Body", "Head", "Right Arm", "Body", "Head"],
  Body: ["Body", "Left Leg", "Right Arm", "Body", "Right Leg", "Left Arm"],
  "Right Leg": ["Right Leg", "Body", "Left Leg", "Body", "Right Leg", "Body"],
  "Left Leg": ["Left Leg", "Body", "Right Leg", "Body", "Left Leg", "Body"],
};

export default function getWarhammerDamageHitLocation(
  firstLocation: DamageLocation,
  hitIndex: number
): DamageLocation {
  const cycle = locationCycles[firstLocation];
  return cycle[((hitIndex % cycle.length) + cycle.length) % cycle.length];
}
