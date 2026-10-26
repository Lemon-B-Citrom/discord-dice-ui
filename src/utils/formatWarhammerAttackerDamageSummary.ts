import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

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
  return `${parts.join(", ")}:`;
}

/**
 * Single producer for the attack summary line, shared by the Attack results
 * modal, the Attack Discord embed, and the Defender embed echo.
 */
export default function formatWarhammerAttackerDamageSummary(
  summary: WarhammerAttackerDamageSummary
): string {
  return `${formatWarhammerAttackerDamageSummaryHeader(summary)} ${summary.damages.join(
    ", "
  )}`;
}
