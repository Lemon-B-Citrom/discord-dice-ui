import {
  AdvancedDefenseField,
  DamageLocation,
  DefenderDamageValidationErrors,
  WarhammerAdvancedDefenses,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { DAMAGE_LOCATION_SHORT_LABELS } from "./damageLocations";
import {
  NON_NEGATIVE_INTEGER_ERROR,
  parseOptionalNonNegativeInteger,
} from "./safeInteger";

export interface AdvancedDefenseFieldMap {
  location: DamageLocation;
  label: string;
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
    label: DAMAGE_LOCATION_SHORT_LABELS["Head"],
    armorField: "advancedArmorHead",
    toughnessField: "advancedToughnessHead",
  },
  {
    location: "Left Arm",
    label: DAMAGE_LOCATION_SHORT_LABELS["Left Arm"],
    armorField: "advancedArmorLeftArm",
    toughnessField: "advancedToughnessLeftArm",
  },
  {
    location: "Body",
    label: DAMAGE_LOCATION_SHORT_LABELS["Body"],
    armorField: "advancedArmorBody",
    toughnessField: "advancedToughnessBody",
  },
  {
    location: "Right Arm",
    label: DAMAGE_LOCATION_SHORT_LABELS["Right Arm"],
    armorField: "advancedArmorRightArm",
    toughnessField: "advancedToughnessRightArm",
  },
  {
    location: "Left Leg",
    label: DAMAGE_LOCATION_SHORT_LABELS["Left Leg"],
    armorField: "advancedArmorLeftLeg",
    toughnessField: "advancedToughnessLeftLeg",
  },
  {
    location: "Right Leg",
    label: DAMAGE_LOCATION_SHORT_LABELS["Right Leg"],
    armorField: "advancedArmorRightLeg",
    toughnessField: "advancedToughnessRightLeg",
  },
];

export const ADVANCED_DEFENSE_BY_LOCATION: Record<
  DamageLocation,
  AdvancedDefenseFieldMap
> = ADVANCED_DEFENSE_FIELDS.reduce(
  (byLocation, field) => ({ ...byLocation, [field.location]: field }),
  {} as Record<DamageLocation, AdvancedDefenseFieldMap>
);

export const ADVANCED_DEFENSE_FIELD_KEYS: ReadonlyArray<AdvancedDefenseField> =
  ADVANCED_DEFENSE_FIELDS.reduce<AdvancedDefenseField[]>(
    (keys, field) => keys.concat(field.armorField, field.toughnessField),
    []
  );

export interface NormalizeAdvancedDefensesResult {
  defenses: WarhammerAdvancedDefenses | null;
  errors: DefenderDamageValidationErrors;
}

const parseField = (
  value: string,
  field: AdvancedDefenseField,
  errors: DefenderDamageValidationErrors
): number | null => {
  // The placeholders are 0, so an empty field is an explicit zero override.
  const parsed = parseOptionalNonNegativeInteger(value);
  if (parsed === null) {
    errors[field] = NON_NEGATIVE_INTEGER_ERROR;
  }
  return parsed;
};

/**
 * Turn the twelve raw strings into per-location numbers. Disabled advanced mode
 * never validates, so stored values stay inert while the simple slots are used.
 * The editor passes `true` so its own fields report errors before the box is
 * ticked.
 */
export default function normalizeAdvancedDefenses(
  draft: WarhammerDefenderDamageDraft,
  enabled: boolean = draft.advancedEnabled
): NormalizeAdvancedDefensesResult {
  const errors: DefenderDamageValidationErrors = {};
  if (!enabled) return { defenses: null, errors };

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
