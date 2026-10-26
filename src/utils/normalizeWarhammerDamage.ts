import {
  DamageLocation,
  DamageValidationErrors,
  NormalizeDamageResult,
  WarhammerDamageDraft,
  WarhammerDamageRequest,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import parseWarhammerAttackSummary from "./parseWarhammerAttackSummary";
import resolveWarhammerArmorLayout from "./resolveWarhammerArmorLayout";

const locations: DamageLocation[] = [
  "Head",
  "Body",
  "Left Arm",
  "Right Arm",
  "Left Leg",
  "Right Leg",
];

const parseNonNegative = (
  value: string,
  field: keyof WarhammerDamageDraft,
  errors: DamageValidationErrors,
  required: boolean
): number | null => {
  const text = value.trim();
  if (!text) {
    if (required) errors[field] = "This field is required";
    return required ? null : 0;
  }
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) {
    errors[field] = "Enter a non-negative safe whole number";
    return null;
  }
  return Number(text);
};

export default function normalizeWarhammerDamage(
  draft: WarhammerDamageDraft
): NormalizeDamageResult {
  const errors: DamageValidationErrors = {};
  const parsed = parseWarhammerAttackSummary(draft.attackSummaryString);
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
  if (locations.indexOf(draft.firstHitLocation as DamageLocation) === -1) {
    errors.firstHitLocation = "Choose a first hit location";
  } else {
    firstHitLocation = draft.firstHitLocation as DamageLocation;
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
    const request: WarhammerDamageRequest = { ...common, mode: "single" };
    return { request, errors };
  }

  if (trueHits === null || magPer === null || woundsPer === null) {
    return { request: null, errors };
  }
  const request: WarhammerDamageRequest = {
    ...common,
    mode: "horde",
    trueHits,
    magPer,
    devastating: devastating === null ? 0 : devastating,
    woundsPer,
  };
  return { request, errors };
}
