import {
  ArmorSlot,
  ArmorSource,
  DefenderDamageValidationErrors,
  WarhammerArmorLayout,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  NON_NEGATIVE_INTEGER_ERROR,
  requireNonNegativeInteger,
} from "./safeInteger";

export interface ResolveArmorResult {
  armor: WarhammerArmorLayout | null;
  errors: DefenderDamageValidationErrors;
}

type ArmorField = "armorHead" | "armorBody" | "armorArms" | "armorLegs";

const ARMOR_FIELDS: ReadonlyArray<{ field: ArmorField; slot: ArmorSlot }> = [
  { field: "armorHead", slot: "headAP" },
  { field: "armorBody", slot: "bodyAP" },
  { field: "armorArms", slot: "armsAP" },
  { field: "armorLegs", slot: "legsAP" },
];

/** The slots that can inherit a value; the body slot is always its own source. */
const INHERITING_SLOTS: ReadonlyArray<ArmorSlot> = [
  "headAP",
  "armsAP",
  "legsAP",
];

/**
 * Resolve the four simple armor slots from the draft.
 *
 * Body can fill every omitted slot; when one other slot is supplied, that value
 * fills the remaining omitted slots. Other partial layouts need explicit values.
 */
export default function resolveWarhammerArmorLayout(
  draft: WarhammerDefenderDamageDraft
): ResolveArmorResult {
  const errors: DefenderDamageValidationErrors = {};
  const armor: Record<ArmorSlot, number> = {
    headAP: 0,
    bodyAP: 0,
    armsAP: 0,
    legsAP: 0,
  };
  const sources: Record<ArmorSlot, ArmorSource> = {
    headAP: "omitted",
    bodyAP: "omitted",
    armsAP: "omitted",
    legsAP: "omitted",
  };
  const supplied: ArmorSlot[] = [];

  ARMOR_FIELDS.forEach(({ field, slot }) => {
    const text = draft[field].trim();
    if (!text) return;
    const value = requireNonNegativeInteger(text);
    if (value === null) {
      errors[field] = NON_NEGATIVE_INTEGER_ERROR;
      return;
    }
    supplied.push(slot);
    armor[slot] = value;
    sources[slot] = "explicit";
  });

  if (Object.keys(errors).length > 0) return { armor: null, errors };

  const bodySupplied = supplied.indexOf("bodyAP") !== -1;
  const otherSupplied = supplied.filter((slot) => slot !== "bodyAP");
  const inheritedSlot =
    bodySupplied && otherSupplied.length === 1 ? otherSupplied[0] : null;

  if (bodySupplied && otherSupplied.length <= 1) {
    const inheritedSource: ArmorSource = inheritedSlot ? "other-part" : "body";
    INHERITING_SLOTS.forEach((slot) => {
      if (sources[slot] !== "explicit") {
        armor[slot] = inheritedSlot
          ? armor[inheritedSlot]
          : armor.bodyAP;
        sources[slot] = inheritedSource;
      }
    });
  } else if (supplied.length > 0 && supplied.length < ARMOR_FIELDS.length) {
    ARMOR_FIELDS.forEach(({ field, slot }) => {
      if (sources[slot] === "omitted") {
        errors[field] = "Enter armor for this location";
      }
    });
    if (Object.keys(errors).length > 0) {
      return { armor: null, errors };
    }
  }

  return { armor: { ...armor, sources }, errors };
}
