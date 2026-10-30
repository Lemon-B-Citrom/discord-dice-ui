import {
  WarhammerAttackerDamageResult,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "./safeInteger";

/** Project a completed attack through the single validated summary path. */
export default function projectWarhammerAttackerDamageSummary(
  result: WarhammerAttackerDamageResult
): WarhammerAttackerDamageSummary {
  const { input, damages, hitDetails } = result;
  const baseDamages = hitDetails.map((hit) => {
    const selected = hit.attempts[hit.selectedAttemptIndex];
    if (!selected) throw new Error("Invalid Warhammer attack result");
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
    damages: damages.map((damage) => requireSafeInteger(damage, "Damage value")),
    baseDamages,
  };
}
