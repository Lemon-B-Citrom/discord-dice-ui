import {
  DefenderDamageEntryBase,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderHordeDamageHit,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

export interface WarhammerMagnitudeBasis {
  label: string;
  operand: number;
}

export interface WarhammerToughnessTerm {
  fortitudeApplied: boolean;
  beforeFelling: number;
  felling: number;
  effective: number;
  reduced: boolean;
  overridden: boolean;
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
    case "ordinary":
    case "bonus":
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
  return {
    fortitudeApplied: entry.fortitudeApplied,
    beforeFelling: entry.toughnessBeforeFelling,
    felling: request.summary.felling,
    effective: entry.effectiveToughnessBonus,
    reduced: entry.effectiveToughnessBonus < entry.toughnessBeforeFelling,
    overridden: request.summary.felling > entry.toughnessBeforeFelling,
  };
}
