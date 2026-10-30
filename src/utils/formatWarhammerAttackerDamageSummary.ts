import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { DAMAGE_LOCATION_WIRE_TOKENS, VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS } from "./damageLocations";
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
  const locationToken = (DAMAGE_LOCATION_WIRE_TOKENS as any)[summary.firstHitLocation] || (VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS as any)[summary.firstHitLocation];
  if (!locationToken) throw new Error("Invalid first hit location");
  parts.push(locationToken);
  return `${parts.join(", ")}:`;
}

/**
 * Single producer for the attack summary line, shared by the Attack results
 * modal, the Attack Discord embed, and the Defender embed echo.
 */
export default function formatWarhammerAttackerDamageSummary(
  summary: WarhammerAttackerDamageSummary
): string {
  if (summary.baseDamages && summary.baseDamages.length !== summary.damages.length) {
    throw new Error("Invalid Righteous Fury base damage metadata");
  }
  const damages = summary.damages.map((damage, index) => {
    requireSafeInteger(damage, "Damage value");
    if (!summary.baseDamages) return `${damage}`;
    const base = requireSafeInteger(summary.baseDamages[index], "Base damage");
    const extra = requireSafeInteger(damage - base, "Righteous Fury extra");
    if (extra < 0) throw new Error("Righteous Fury base cannot exceed total damage");
    return extra === 0 ? `${damage}` : `${damage}(${base})`;
  });
  return `${formatWarhammerAttackerDamageSummaryHeader(summary)} ${damages.join(" ")}`;
}
