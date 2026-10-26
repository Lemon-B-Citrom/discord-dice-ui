import {
  DAMAGE_LOCATIONS,
  DamageLocation,
  DefenderDamageValidationErrors,
  NormalizeDefenderDamageResult,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageRequest,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import parseWarhammerAttackerDamageSummary from "./parseWarhammerAttackerDamageSummary";
import resolveWarhammerArmorLayout from "./resolveWarhammerArmorLayout";
import {
  NON_NEGATIVE_INTEGER_ERROR,
  requireNonNegativeInteger,
} from "./safeInteger";

const parseNonNegative = (
  value: string,
  field: keyof WarhammerDefenderDamageDraft,
  errors: DefenderDamageValidationErrors,
  required: boolean
): number | null => {
  const text = value.trim();
  if (!text) {
    if (required) errors[field] = "This field is required";
    return required ? null : 0;
  }
  const parsed = requireNonNegativeInteger(text);
  if (parsed === null) {
    errors[field] = NON_NEGATIVE_INTEGER_ERROR;
    return null;
  }
  return parsed;
};

export default function normalizeWarhammerDefenderDamage(
  draft: WarhammerDefenderDamageDraft
): NormalizeDefenderDamageResult {
  const errors: DefenderDamageValidationErrors = {};
  const parsed = parseWarhammerAttackerDamageSummary(draft.attackSummaryString);
  if (!parsed.summary) errors.attackSummaryString = parsed.error || "Invalid summary";

  const toughnessBonus = parseNonNegative(
    draft.toughnessBonus,
    "toughnessBonus",
    errors,
    false
  );
  const fortitude = parseNonNegative(draft.fortitude, "fortitude", errors, false);
  const armor = resolveWarhammerArmorLayout(draft);
  Object.assign(errors, armor.errors);

  let firstHitLocation: DamageLocation | null = null;
  // The draft keeps raw strings, so this is the single documented cast that
  // lets a programmatic request be validated against the shared location list.
  const selectedLocation = draft.firstHitLocation as DamageLocation;
  if (DAMAGE_LOCATIONS.indexOf(selectedLocation) === -1) {
    errors.firstHitLocation = "Choose a first hit location";
  } else {
    firstHitLocation = selectedLocation;
  }

  const hordeValues = [draft.trueHits, draft.magPer, draft.devastating, draft.woundsPer];
  const isHorde = hordeValues.some((value) => value.trim().length > 0);

  let trueHits: number | null = null;
  let magPer: number | null = null;
  let devastating: number | null = null;
  let woundsPer: number | null = null;
  if (isHorde) {
    trueHits = parseNonNegative(draft.trueHits, "trueHits", errors, true);
    magPer = parseNonNegative(draft.magPer, "magPer", errors, true);
    devastating = parseNonNegative(draft.devastating, "devastating", errors, false);
    woundsPer = parseNonNegative(draft.woundsPer, "woundsPer", errors, true);
    if (
      trueHits !== null &&
      parsed.summary &&
      trueHits > parsed.summary.damages.length
    ) {
      errors.trueHits = `True Hits cannot exceed ${parsed.summary.damages.length}`;
    }
  }

  if (
    Object.keys(errors).length > 0 ||
    !parsed.summary ||
    toughnessBonus === null ||
    fortitude === null ||
    !armor.armor ||
    !firstHitLocation
  ) {
    return { request: null, errors };
  }

  const common = {
    summary: parsed.summary,
    toughnessBonus,
    fortitude,
    armor: armor.armor,
    firstHitLocation,
  };
  if (!isHorde) {
    const request: WarhammerDefenderDamageRequest = { ...common, mode: "single" };
    return { request, errors };
  }

  if (trueHits === null || magPer === null || woundsPer === null) {
    return { request: null, errors };
  }
  const request: WarhammerDefenderDamageRequest = {
    ...common,
    mode: "horde",
    trueHits,
    magPer,
    devastating: devastating === null ? 0 : devastating,
    woundsPer,
  };
  return { request, errors };
}
