import {
  DAMAGE_LOCATIONS,
  WarhammerDefenderDamageHit,
  WarhammerDefenderDamageResult,
  WarhammerDefenderDefenses,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "../../safeInteger";

const INVALID_RESULT = "Invalid Warhammer damage result";

function assertSafeIntegers(values: ReadonlyArray<number>): void {
  values.forEach((value) => requireSafeInteger(value, "Damage value"));
}

function assertDefenses(defenses: WarhammerDefenderDefenses): void {
  if (defenses.mode === "advanced") {
    DAMAGE_LOCATIONS.forEach((location) => {
      assertSafeIntegers([
        defenses.armor[location],
        defenses.toughnessBonus[location],
      ]);
    });
    return;
  }
  assertSafeIntegers([
    defenses.armor.headAP,
    defenses.armor.bodyAP,
    defenses.armor.armsAP,
    defenses.armor.legsAP,
  ]);
}

function assertHitNumbers(entry: WarhammerDefenderDamageHit): void {
  assertSafeIntegers([
    entry.index,
    entry.number,
    entry.originalDamage,
    entry.armorBeforePenetration,
    entry.effectiveArmor,
    entry.finalDamage,
  ]);
  if (entry.targetFamily === "humanoid") {
    assertSafeIntegers([
      entry.effectiveToughnessBonus,
      entry.toughnessBeforeFelling,
    ]);
  } else {
    assertSafeIntegers([entry.baseDamage, entry.righteousFuryExtra]);
  }
  if (entry.index < 0 || entry.number !== entry.index + 1) {
    throw new Error(INVALID_RESULT);
  }
  if (entry.mode === "horde") {
    assertSafeIntegers([
      entry.baseMagnitude,
      entry.devastatingAdded,
      entry.magnitude,
    ]);
  }
}

/** Validate calculation output before handing it to presentation code. */
export function validateWarhammerDefenderDamageResult(
  result: WarhammerDefenderDamageResult
): WarhammerDefenderDamageResult {
  if (result.request.targetFamily === "humanoid") {
    assertDefenses(result.request.defenses);
  }
  if (result.request.mode === "horde") {
    assertSafeIntegers([
      result.request.trueHits,
      result.request.magPer,
      result.request.woundsPer,
    ]);
  }
  result.entries.forEach((entry) => {
    if (entry.kind === "bonus-devastating") {
      assertSafeIntegers([entry.number, entry.magnitude]);
    } else {
      assertHitNumbers(entry);
    }
  });
  assertSafeIntegers([result.totals.damage]);
  if (result.request.mode === "horde") {
    const {
      magnitude = 0,
      killCount = 0,
      killCountUnavailable,
    } = result.totals;
    assertSafeIntegers([magnitude]);
    if (!killCountUnavailable) assertSafeIntegers([killCount]);
  }
  return result;
}
