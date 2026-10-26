import { DamageLocation } from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import getWarhammerDamageHitLocation from "./getWarhammerDamageHitLocation";

test.each([
  ["Head", ["Head", "Right Arm", "Body", "Left Arm", "Body", "Head"]],
  ["Right Arm", ["Right Arm", "Body", "Head", "Left Arm", "Body", "Head"]],
  ["Left Arm", ["Left Arm", "Body", "Head", "Right Arm", "Body", "Head"]],
  ["Body", ["Body", "Left Leg", "Right Arm", "Body", "Right Leg", "Left Arm"]],
  ["Right Leg", ["Right Leg", "Body", "Left Leg", "Body", "Right Leg", "Body"]],
  ["Left Leg", ["Left Leg", "Body", "Right Leg", "Body", "Left Leg", "Body"]],
] as Array<[DamageLocation, DamageLocation[]]>) (
  "%s cycle repeats after six entries",
  (start, expected) => {
    expect(expected.map((_location, index) => getWarhammerDamageHitLocation(start, index))).toEqual(expected);
    expect(getWarhammerDamageHitLocation(start, 6)).toBe(expected[0]);
    expect(getWarhammerDamageHitLocation(start, 7)).toBe(expected[1]);
  }
);
