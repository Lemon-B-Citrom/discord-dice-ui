import {
  AdvancedDefenseField,
  DamageLocation,
  DefenderDamageValidationErrors,
  WarhammerAdvancedDefenses,
  WarhammerDefenderDamageDraft,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { NON_NEGATIVE_INTEGER_ERROR } from "../../safeInteger";
import { parseNonNegativeField } from "../shared/damageFieldParsing";

export interface AdvancedDefenseFieldMap {
  location: DamageLocation;
  armorField: AdvancedDefenseField;
  toughnessField: AdvancedDefenseField;
}

/**
 * Single owner of the advanced defense locations and their draft field keys.
 * Reading order and visual order agree, so DOM order stays the accessible order
 * for keyboard and screen readers.
 */
export const ADVANCED_DEFENSE_FIELDS: ReadonlyArray<AdvancedDefenseFieldMap> = [
  {
    location: "Head",
    armorField: "advancedArmorHead",
    toughnessField: "advancedToughnessHead",
  },
  {
    location: "Left Arm",
    armorField: "advancedArmorLeftArm",
    toughnessField: "advancedToughnessLeftArm",
  },
  {
    location: "Body",
    armorField: "advancedArmorBody",
    toughnessField: "advancedToughnessBody",
  },
  {
    location: "Right Arm",
    armorField: "advancedArmorRightArm",
    toughnessField: "advancedToughnessRightArm",
  },
  {
    location: "Left Leg",
    armorField: "advancedArmorLeftLeg",
    toughnessField: "advancedToughnessLeftLeg",
  },
  {
    location: "Right Leg",
    armorField: "advancedArmorRightLeg",
    toughnessField: "advancedToughnessRightLeg",
  },
];

export const ADVANCED_DEFENSE_BY_LOCATION: Record<
  DamageLocation,
  AdvancedDefenseFieldMap
> = {} as Record<DamageLocation, AdvancedDefenseFieldMap>;
ADVANCED_DEFENSE_FIELDS.forEach((field) => {
  ADVANCED_DEFENSE_BY_LOCATION[field.location] = field;
});

const advancedDefenseFieldKeys: AdvancedDefenseField[] = [];
ADVANCED_DEFENSE_FIELDS.forEach(({ armorField, toughnessField }) => {
  advancedDefenseFieldKeys.push(armorField, toughnessField);
});
export const ADVANCED_DEFENSE_FIELD_KEYS: ReadonlyArray<AdvancedDefenseField> =
  advancedDefenseFieldKeys;

export interface NormalizeAdvancedDefensesResult {
  defenses: WarhammerAdvancedDefenses | null;
  errors: DefenderDamageValidationErrors;
}

export interface NormalizeAdvancedDefensesOptions {
  validateWhenDisabled?: boolean;
}

const parseField = (
  value: string,
  field: AdvancedDefenseField,
  errors: DefenderDamageValidationErrors
): number | null => {
  return parseNonNegativeField(value, field, errors, {
    invalidMessage: NON_NEGATIVE_INTEGER_ERROR,
  });
};

/**
 * Turn the twelve raw strings into per-location numbers. Disabled advanced mode
 * never validates, so stored values stay inert while the simple slots are used.
 * The editor passes `true` so its own fields report errors before the box is
 * ticked.
 */
export function normalizeAdvancedDefenses(
  draft: WarhammerDefenderDamageDraft,
  options: NormalizeAdvancedDefensesOptions = {}
): NormalizeAdvancedDefensesResult {
  const errors: DefenderDamageValidationErrors = {};
  if (!draft.advancedEnabled && !options.validateWhenDisabled) {
    return { defenses: null, errors };
  }

  const armor = {} as Record<DamageLocation, number>;
  const toughnessBonus = {} as Record<DamageLocation, number>;
  let hasInvalidValue = false;

  ADVANCED_DEFENSE_FIELDS.forEach(
    ({ location, armorField, toughnessField }) => {
      const armorValue = parseField(draft[armorField], armorField, errors);
      const toughnessValue = parseField(
        draft[toughnessField],
        toughnessField,
        errors
      );
      if (armorValue === null || toughnessValue === null) {
        hasInvalidValue = true;
        return;
      }
      armor[location] = armorValue;
      toughnessBonus[location] = toughnessValue;
    }
  );

  if (hasInvalidValue) return { defenses: null, errors };
  return { defenses: { armor, toughnessBonus }, errors };
}
