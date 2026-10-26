import {
  AttackCalculatorErrors,
  AttackCalculatorValues,
  WarhammerAttackInput,
} from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

export const WARHAMMER_ATTACK_DEFAULTS: WarhammerAttackInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  tearing: "none",
};

const MAX_HITS = 100;
const MAX_DAMAGE_DICE = 100;

export interface NormalizeAttackResult {
  input?: WarhammerAttackInput;
  errors: AttackCalculatorErrors;
}

export default function normalizeWarhammerAttack(
  values: AttackCalculatorValues
): NormalizeAttackResult {
  const errors: AttackCalculatorErrors = {};
  const parsed: Partial<WarhammerAttackInput> = {};
  const numericFields: Array<keyof Omit<WarhammerAttackInput, "tearing">> = [
    "hits",
    "damageDice",
    "damageModifier",
    "penetration",
    "felling",
    "proven",
    "rfOn",
    "rfConfirmsOn",
  ];

  numericFields.forEach((field) => {
    const rawValue = values[field].trim();
    const value = rawValue === "" ? WARHAMMER_ATTACK_DEFAULTS[field] : Number(rawValue);
    if (!Number.isSafeInteger(value)) {
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
    parsed[field] = value as never;
  });

  if (values.tearing !== "none" && values.tearing !== "tearing" && values.tearing !== "tripleTearing") {
    errors.tearing = "Select a tearing option";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    input: {
      ...(parsed as Omit<WarhammerAttackInput, "tearing">),
      tearing: values.tearing,
    },
    errors,
  };
}
