import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { getDamageLocationWireToken } from "./damageLocations";
import { requireSafeInteger } from "./safeInteger";

/**
 * Build the canonical header for an attack summary. Zero-valued optional traits
 * are omitted so a summary never states a trait the attack does not have; the
 * parser treats an absent Felling or Devastating as zero.
 */
export function formatWarhammerAttackerDamageSummaryHeader(
  summary: WarhammerAttackerDamageSummary
): string {
  const parts = [`Pen ${summary.penetration}`];
  if (summary.felling !== 0) {
    parts.push(`Fel ${summary.felling}`);
  }
  if (summary.devastating !== 0) {
    parts.push(`Dev ${summary.devastating}`);
  }
  const locationToken = getDamageLocationWireToken(summary.firstHitLocation);
  if (!locationToken) throw new Error("Invalid first hit location");
  parts.push(locationToken);
  return `${parts.join(", ")}:`;
}

/**
 * One hit as a single summary token: the total alone, or `25(10)` when a
 * confirmed Fury raised it, where the parenthesised value is the pre-Fury base.
 * Callers must keep a token whole when they chunk the summary.
 */
export function formatWarhammerAttackerDamageHit(
  damage: number,
  baseDamage?: number
): string {
  const total = requireSafeInteger(damage, "Damage value");
  if (baseDamage === undefined) return `${total}`;
  const base = requireSafeInteger(baseDamage, "Base damage");
  const furyExtra = requireSafeInteger(total - base, "Righteous Fury extra");
  if (furyExtra < 0) {
    throw new Error("Righteous Fury base cannot exceed total damage");
  }
  return furyExtra === 0 ? `${total}` : `${total}(${base})`;
}

/** Keep each hit token whole while callers pack summaries into embed fields. */
export function getWarhammerAttackerDamageSummaryFragments(
  summary: WarhammerAttackerDamageSummary
): ReadonlyArray<string> {
  if (
    summary.baseDamages &&
    summary.baseDamages.length !== summary.damages.length
  ) {
    throw new Error("Invalid Righteous Fury base damage metadata");
  }
  return [
    `${formatWarhammerAttackerDamageSummaryHeader(summary)} `,
    ...summary.damages.map(
      (damage, index) =>
        `${index > 0 ? " " : ""}${formatWarhammerAttackerDamageHit(
          damage,
          summary.baseDamages?.[index]
        )}`
    ),
  ];
}

/**
 * Single producer for the attack summary line, shared by the Attack results
 * modal, the Attack Discord embed, and the Defender embed echo.
 */
export default function formatWarhammerAttackerDamageSummary(
  summary: WarhammerAttackerDamageSummary
): string {
  return getWarhammerAttackerDamageSummaryFragments(summary).join("");
}
