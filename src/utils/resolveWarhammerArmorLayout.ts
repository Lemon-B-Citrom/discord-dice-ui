import {
  DamageValidationErrors,
  WarhammerArmorLayout,
  WarhammerDamageDraft,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";

export interface ResolveArmorResult {
  armor: WarhammerArmorLayout | null;
  errors: DamageValidationErrors;
}

type ArmorField = "armorHead" | "armorBody" | "armorArms" | "armorLegs";
type ArmorSlot = "headAP" | "bodyAP" | "armsAP" | "legsAP";

const fieldSlots: Array<{ field: ArmorField; slot: ArmorSlot }> = [
  { field: "armorHead", slot: "headAP" },
  { field: "armorBody", slot: "bodyAP" },
  { field: "armorArms", slot: "armsAP" },
  { field: "armorLegs", slot: "legsAP" },
];

export default function resolveWarhammerArmorLayout(
  draft: WarhammerDamageDraft
): ResolveArmorResult {
  const errors: DamageValidationErrors = {};
  const parsed: Partial<Record<ArmorSlot, number>> = {};
  const supplied: ArmorSlot[] = [];

  fieldSlots.forEach(({ field, slot }) => {
    const text = draft[field].trim();
    if (!text) return;
    supplied.push(slot);
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) {
      errors[field] = "Enter a non-negative safe whole number";
      return;
    }
    parsed[slot] = Number(text);
  });

  if (Object.keys(errors).length > 0) return { armor: null, errors };

  const body = parsed.bodyAP;
  const otherSupplied = supplied.filter((slot) => slot !== "bodyAP");
  const values: Partial<Record<ArmorSlot, number>> = { ...parsed };
  const sources: Partial<Record<ArmorSlot, WarhammerArmorLayout["sources"][ArmorSlot]>> = {};

  supplied.forEach((slot) => {
    sources[slot] = "explicit";
  });

  if (supplied.length === 0) {
    fieldSlots.forEach(({ slot }) => {
      values[slot] = 0;
      sources[slot] = "omitted";
    });
  } else if (body !== undefined && otherSupplied.length === 0) {
    fieldSlots.forEach(({ slot }) => {
      if (values[slot] === undefined) {
        values[slot] = body;
        sources[slot] = "body";
      }
    });
  } else if (body !== undefined && otherSupplied.length === 1) {
    const inherited = parsed[otherSupplied[0]] as number;
    fieldSlots.forEach(({ slot }) => {
      if (slot !== "bodyAP" && values[slot] === undefined) {
        values[slot] = inherited;
        sources[slot] = "other-part";
      }
    });
  } else {
    fieldSlots.forEach(({ field, slot }) => {
      if (values[slot] === undefined) {
        errors[field] = "Enter armor for this location";
      }
    });
  }

  if (Object.keys(errors).length > 0) return { armor: null, errors };

  return {
    armor: {
      headAP: values.headAP as number,
      bodyAP: values.bodyAP as number,
      armsAP: values.armsAP as number,
      legsAP: values.legsAP as number,
      sources: {
        headAP: sources.headAP as WarhammerArmorLayout["sources"]["headAP"],
        bodyAP: sources.bodyAP as WarhammerArmorLayout["sources"]["bodyAP"],
        armsAP: sources.armsAP as WarhammerArmorLayout["sources"]["armsAP"],
        legsAP: sources.legsAP as WarhammerArmorLayout["sources"]["legsAP"],
      },
    },
    errors,
  };
}
