import { requireSafeInteger } from "../../safeInteger";

export const FURY_BASE_ERROR =
  "Righteous Fury base damage cannot exceed the total damage";

/** Return a Fury difference only when it remains inside the safe integer range. */
export function getRighteousFuryExtra(
  totalDamage: number,
  baseDamage: number
): number | null {
  const extra = totalDamage - baseDamage;
  return Number.isSafeInteger(extra) ? extra : null;
}

/** Validate and return the Fury difference for calculation and formatting. */
export function requireRighteousFuryExtra(
  totalDamage: number,
  baseDamage: number
): number {
  requireSafeInteger(totalDamage, "Damage value");
  requireSafeInteger(baseDamage, "Base damage");
  const extra = getRighteousFuryExtra(totalDamage, baseDamage);
  return extra === null
    ? requireSafeInteger(totalDamage - baseDamage, "Righteous Fury extra")
    : extra;
}
