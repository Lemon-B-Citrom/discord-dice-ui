import {
  DamageLocation,
  DefenderDamageValidationErrors,
  NormalizeDefenderDamageResult,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDefenses,
  WarhammerDefenderVehicleDamageRequest,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  normalizeAdvancedDefenses,
  NormalizeAdvancedDefensesResult,
} from "./advancedDefenses";
import { parseWarhammerAttackerDamageSummary } from "../attacker/attackerDamageSummary";
import {
  isVehicleDamageLocation,
  isVehicleFacing,
} from "../shared/damageLocations";
import {
  resolveWarhammerArmorLayout,
  ResolveArmorResult,
} from "./resolveWarhammerArmorLayout";
import { NON_NEGATIVE_INTEGER_ERROR } from "../../safeInteger";
import { parseNonNegativeField } from "../shared/damageFieldParsing";

const parseNonNegative = (
  value: string,
  field: keyof WarhammerDefenderDamageDraft,
  errors: DefenderDamageValidationErrors,
  required: boolean
): number | null =>
  parseNonNegativeField(value, field, errors, {
    required,
    invalidMessage: NON_NEGATIVE_INTEGER_ERROR,
  });

/** Advanced mode replaces the four inherited slots, so only one source is live. */
const pickDefenses = (
  advanced: NormalizeAdvancedDefensesResult,
  armor: ResolveArmorResult | null
): WarhammerDefenderDefenses | null => {
  if (advanced.defenses) return { mode: "advanced", ...advanced.defenses };
  if (armor && armor.armor) return { mode: "simple", armor: armor.armor };
  return null;
};

export function normalizeWarhammerDefenderDamage(
  draft: WarhammerDefenderDamageDraft
): NormalizeDefenderDamageResult {
  const errors: DefenderDamageValidationErrors = {};
  const parsed = parseWarhammerAttackerDamageSummary(draft.attackSummaryString);
  if (!parsed.summary) {
    errors.attackSummaryString = parsed.error || "Invalid summary";
    return { request: null, errors };
  }

  if (isVehicleDamageLocation(parsed.summary.firstHitLocation)) {
    // Facing is required even for a Turret-only summary, so the request stays
    // valid whatever the later random locations turn out to be.
    const facing = isVehicleFacing(draft.facing) ? draft.facing : null;
    if (!facing) errors.facing = "Choose a facing";
    // Each blank facing AP is its own zero: no humanoid inheritance applies.
    const armorFront = parseNonNegative(
      draft.armorFront,
      "armorFront",
      errors,
      false
    );
    const armorSide = parseNonNegative(
      draft.armorSide,
      "armorSide",
      errors,
      false
    );
    const armorRear = parseNonNegative(
      draft.armorRear,
      "armorRear",
      errors,
      false
    );
    if (
      Object.keys(errors).length > 0 ||
      !facing ||
      armorFront === null ||
      armorSide === null ||
      armorRear === null
    ) {
      return { request: null, errors };
    }
    const request: WarhammerDefenderVehicleDamageRequest = {
      mode: "single",
      targetFamily: "vehicle",
      summary: parsed.summary,
      firstHitLocation: parsed.summary.firstHitLocation,
      vehicleFacing: facing,
      vehicleArmor: { Front: armorFront, Side: armorSide, Rear: armorRear },
      hasTurret: draft.hasTurret,
    };
    return { request, errors };
  }

  const toughnessBonus = parseNonNegative(
    draft.toughnessBonus,
    "toughnessBonus",
    errors,
    false
  );
  const fortitude = parseNonNegative(
    draft.fortitude,
    "fortitude",
    errors,
    false
  );
  // Advanced mode replaces the four inherited slots entirely, so their rules
  // can never block a calculation that does not read them.
  const armor = draft.advancedEnabled
    ? null
    : resolveWarhammerArmorLayout(draft);
  const advanced = normalizeAdvancedDefenses(draft);
  if (armor) Object.assign(errors, armor.errors);
  Object.assign(errors, advanced.errors);
  const defenses = pickDefenses(advanced, armor);

  const firstHitLocation: DamageLocation = parsed.summary.firstHitLocation;

  // Horde mode is opt-in: blank fields alone no longer select it.
  const isHorde = draft.hordeEnabled;

  let bonusHits: number | null = null;
  let trueHits: number | null = null;
  let woundsPer: number | null = null;
  if (isHorde) {
    // Zero bonus hits is the default, so a blank field is valid.
    bonusHits = parseNonNegative(draft.bonusHits, "bonusHits", errors, false);
    woundsPer = parseNonNegative(draft.woundsPer, "woundsPer", errors, true);
    if (bonusHits !== null && parsed.summary) {
      if (bonusHits > parsed.summary.damages.length) {
        errors.bonusHits = `Bonus Hits cannot exceed ${parsed.summary.damages.length}`;
      } else {
        // The request keeps the rules-facing count, so the calculator and the
        // embed are unchanged: every hit that is not a bonus hit is a true hit.
        trueHits = parsed.summary.damages.length - bonusHits;
      }
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
    targetFamily: "humanoid" as const,
    summary: parsed.summary,
    toughnessBonus,
    fortitude,
    defenses,
    firstHitLocation,
  };
  if (!isHorde) {
    const request: WarhammerDefenderDamageRequest = {
      ...common,
      mode: "single",
    };
    return { request, errors };
  }

  if (trueHits === null || woundsPer === null) {
    return { request: null, errors };
  }
  const bodyArmor =
    defenses.mode === "advanced" ? defenses.armor.Body : defenses.armor.bodyAP;
  // Math.round rounds a positive half value up, as required by the rules.
  const magPer = Math.round(
    woundsPer / 10 + toughnessBonus / 5 + bodyArmor / 5
  );
  const request: WarhammerDefenderDamageRequest = {
    ...common,
    mode: "horde",
    trueHits,
    magPer,
    woundsPer,
  };
  return { request, errors };
}
