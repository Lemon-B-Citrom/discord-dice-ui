import {
  AttackerDamageErrors,
  AttackerDamageValues,
  WarhammerAttackerDamageInput,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { parseSafeInteger } from "./safeInteger";

export const WARHAMMER_ATTACKER_DAMAGE_DEFAULTS: WarhammerAttackerDamageInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  tearing: "none",
};

const MAX_HITS = 100;
const MAX_DAMAGE_DICE = 100;

export interface NormalizeAttackResult {
  input?: WarhammerAttackerDamageInput;
  errors: AttackerDamageErrors;
}

export default function normalizeWarhammerAttackerDamage(
  values: AttackerDamageValues
): NormalizeAttackResult {
  const errors: AttackerDamageErrors = {};
  const parsed: Partial<WarhammerAttackerDamageInput> = {};
  const numericFields: Array<keyof Omit<WarhammerAttackerDamageInput, "tearing">> = [
    "hits",
    "damageDice",
    "damageModifier",
    "penetration",
    "felling",
    "devastating",
    "proven",
    "rfOn",
    "rfConfirmsOn",
  ];

  numericFields.forEach((field) => {
    const rawValue = values[field].trim();
    const value =
      rawValue === ""
        ? WARHAMMER_ATTACKER_DAMAGE_DEFAULTS[field]
        : parseSafeInteger(rawValue);
    if (value === null) {
      errors[field] = "Enter a whole number";
      return;
    }
    if (field !== "damageModifier" && value < 0) {
      errors[field] = "Must be 0 or greater";
      return;
    }
    if (field === "hits" && (value < 1 || value > MAX_HITS)) {
      errors[field] = `Enter between 1 and ${MAX_HITS} hits`;
      return;
    }
    if (field === "damageDice" && (value < 1 || value > MAX_DAMAGE_DICE)) {
      errors[field] = `Enter between 1 and ${MAX_DAMAGE_DICE} damage dice`;
      return;
    }
    parsed[field] = value;
  });

  if (values.tearing !== "none" && values.tearing !== "tearing" && values.tearing !== "tripleTearing") {
    errors.tearing = "Select a tearing option";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    input: {
      ...(parsed as Omit<WarhammerAttackerDamageInput, "tearing">),
      tearing: values.tearing,
    },
    errors,
  };
}
