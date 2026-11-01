import { WarhammerAttackerDamageResult } from "../../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { WarhammerAttackerDamageSummary } from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "../../safeInteger";
import { getDamageLocationWireToken } from "../shared/damageLocations";
import { requireRighteousFuryExtra } from "../shared/righteousFury";

function formatHeader(summary: WarhammerAttackerDamageSummary): string {
  const parts = [`Pen ${summary.penetration}`];
  if (summary.felling !== 0) parts.push(`Fel ${summary.felling}`);
  if (summary.devastating !== 0) parts.push(`Dev ${summary.devastating}`);
  const locationToken = getDamageLocationWireToken(summary.firstHitLocation);
  if (!locationToken) throw new Error("Invalid first hit location");
  parts.push(locationToken);
  return `${parts.join(", ")}:`;
}

function formatHit(damage: number, baseDamage?: number): string {
  const total = requireSafeInteger(damage, "Damage value");
  if (baseDamage === undefined) return `${total}`;
  const base = requireSafeInteger(baseDamage, "Base damage");
  const furyExtra = requireRighteousFuryExtra(total, base);
  if (furyExtra < 0) {
    throw new Error("Righteous Fury base cannot exceed total damage");
  }
  return furyExtra === 0 ? `${total}` : `${total}(${base})`;
}

/** Produce whole summary tokens so callers can chunk them without splitting hits. */
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
    `${formatHeader(summary)} `,
    ...summary.damages.map(
      (damage, index) =>
        `${index > 0 ? " " : ""}${formatHit(
          damage,
          summary.baseDamages?.[index]
        )}`
    ),
  ];
}

/** Format the canonical attack summary shared by result and webhook output. */
export function formatWarhammerAttackerDamageSummary(
  summary: WarhammerAttackerDamageSummary
): string {
  return getWarhammerAttackerDamageSummaryFragments(summary).join("");
}

/** Project a completed attack through the same validated summary path. */
export function projectWarhammerAttackerDamageSummary(
  result: WarhammerAttackerDamageResult
): WarhammerAttackerDamageSummary {
  const { input, damages, hitDetails } = result;
  if (damages.length !== input.hits || hitDetails.length !== input.hits) {
    throw new Error("Invalid Warhammer attack result");
  }
  const baseDamages = hitDetails.map((hit, index) => {
    const selected = hit.attempts[hit.selectedAttemptIndex];
    if (
      hit.attempts.length === 0 ||
      hit.selectedAttemptIndex < 0 ||
      hit.selectedAttemptIndex >= hit.attempts.length ||
      !selected ||
      selected.damage !== damages[index]
    ) {
      throw new Error("Invalid Warhammer attack result");
    }
    const fury = selected.righteousFuryRolls.reduce(
      (sum, roll) => requireSafeInteger(sum + roll, "Righteous Fury total"),
      0
    );
    return requireSafeInteger(selected.damage - fury, "Base damage");
  });
  return {
    penetration: input.penetration,
    felling: input.felling,
    devastating: input.devastating,
    firstHitLocation: input.firstHitLocation,
    damages: damages.map((damage) =>
      requireSafeInteger(damage, "Damage value")
    ),
    baseDamages,
  };
}
