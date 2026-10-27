import {
  DAMAGE_LOCATIONS,
  DamageLocation,
  DefenderDamageValidationErrors,
  NormalizeDefenderDamageResult,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDefenses,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import normalizeAdvancedDefenses from "./advancedDefenses";
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
  // Advanced mode replaces the four inherited slots entirely, so their rules
  // can never block a calculation that does not read them.
  const armor = draft.advancedEnabled ? null : resolveWarhammerArmorLayout(draft);
  if (armor) Object.assign(errors, armor.errors);
  const advanced = normalizeAdvancedDefenses(draft);
  Object.assign(errors, advanced.errors);
  const defenses: WarhammerDefenderDefenses | null = advanced.defenses
    ? { mode: "advanced", ...advanced.defenses }
    : armor && armor.armor
    ? { mode: "simple", armor: armor.armor }
    : null;

  let firstHitLocation: DamageLocation | null = null;
  // The draft keeps raw strings, so this is the single documented cast that
  // lets a programmatic request be validated against the shared location list.
  const selectedLocation = draft.firstHitLocation as DamageLocation;
  if (DAMAGE_LOCATIONS.indexOf(selectedLocation) === -1) {
    errors.firstHitLocation = "Choose a first hit location";
  } else {
    firstHitLocation = selectedLocation;
  }

  // Horde mode is opt-in: blank fields alone no longer select it.
  const isHorde = draft.hordeEnabled;

  let trueHits: number | null = null;
  let magPer: number | null = null;
  let woundsPer: number | null = null;
  if (isHorde) {
    trueHits = parseNonNegative(draft.trueHits, "trueHits", errors, true);
    magPer = parseNonNegative(draft.magPer, "magPer", errors, true);
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
    !defenses ||
    !firstHitLocation
  ) {
    return { request: null, errors };
  }

  const common = {
    summary: parsed.summary,
    toughnessBonus,
    fortitude,
    defenses,
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
    woundsPer,
  };
  return { request, errors };
}
