import { requireSafeInteger } from "../../safeInteger";

const SUPPRESSED_FURY_DAMAGE = 1;

export const checkedAdd = (
  left: number,
  right: number,
  description: string
): number => requireSafeInteger(left + right, description);

export function getVehicleBaseApplied(
  baseDamage: number,
  effectiveArmor: number
): number {
  return Math.max(
    0,
    requireSafeInteger(
      baseDamage - effectiveArmor,
      "Vehicle base damage after armor"
    )
  );
}

export function getVehicleDamageParts(
  baseDamage: number,
  effectiveArmor: number,
  furyExtra: number
): { rfApplied: boolean; damage: number } {
  const baseApplied = getVehicleBaseApplied(baseDamage, effectiveArmor);
  if (baseApplied >= 1) {
    return {
      rfApplied: furyExtra > 0,
      damage: requireSafeInteger(
        baseApplied + furyExtra,
        "Final vehicle damage"
      ),
    };
  }
  return {
    rfApplied: false,
    damage: furyExtra > 0 ? SUPPRESSED_FURY_DAMAGE : 0,
  };
}
