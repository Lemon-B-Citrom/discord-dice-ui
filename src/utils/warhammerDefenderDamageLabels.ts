import {
  DefenderDamageEntryBase,
  HordeDamageClassification,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderHordeDamageHit,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import getWarhammerDefenseForLocation from "./getWarhammerDefenseForLocation";

export interface WarhammerMagnitudeBasis {
  label: string;
  operand: number;
}

export interface WarhammerToughnessTerm {
  fortitudeApplied: boolean;
  /** Per-location Toughness added to the Toughness Bonus, 0 in simple mode. */
  advanced: number;
  beforeFelling: number;
  felling: number;
  effective: number;
  reduced: boolean;
  /** Felling exceeded the whole pool, so the result is floored at zero. */
  fellingExceedsBase: boolean;
}

/**
 * Single owner of the Horde classification wording, shared by the results modal
 * and the Discord formatter. Each renderer adds its own emphasis.
 */
export function getHordeClassificationLabel(
  classification: HordeDamageClassification
): string {
  if (classification === "overkill") return "Overkill!";
  if (classification === "partial-overkill") return "Partial Overkill!";
  return "";
}

/**
 * Single owner of the Horde magnitude label rules, shared by the results modal
 * and the Discord formatter so both renderers cannot disagree.
 */
export function getWarhammerMagnitudeBasis(
  hit: WarhammerDefenderHordeDamageHit
): WarhammerMagnitudeBasis {
  switch (hit.classification) {
    case "overkill":
      return { label: "Per-unit Magnitude", operand: hit.baseMagnitude };
    case "partial-overkill":
      return { label: "Halved Per-unit Magnitude", operand: hit.baseMagnitude };
    case "no-damage":
      return { label: "Nonpositive Damage (0)", operand: 0 };
    default:
      return hit.finalDamage > 0
        ? { label: "Nonzero Damage (1)", operand: 1 }
        : { label: "Nonpositive Damage (0)", operand: 0 };
  }
}

/**
 * Single owner of the Toughness operand decisions, shared by the results modal
 * and the Discord formatter.
 */
export function getWarhammerToughnessTerm(
  entry: DefenderDamageEntryBase,
  request: WarhammerDefenderDamageRequest
): WarhammerToughnessTerm {
  const defense = getWarhammerDefenseForLocation(
    request,
    entry.location,
    entry.armorSlot
  );
  return {
    fortitudeApplied: entry.fortitudeApplied,
    advanced: defense.toughnessBonusAdd,
    beforeFelling: entry.toughnessBeforeFelling,
    felling: request.summary.felling,
    effective: entry.effectiveToughnessBonus,
    reduced: entry.effectiveToughnessBonus < entry.toughnessBeforeFelling,
    fellingExceedsBase:
      request.summary.felling > entry.toughnessBeforeFelling,
  };
}
