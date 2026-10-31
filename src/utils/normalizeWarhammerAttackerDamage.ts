import {
  AttackerDamageErrors,
  AttackerDamageValues,
  WarhammerAttackerDamageInput,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { parseSafeInteger } from "./safeInteger";
import { isDamageLocation, isVehicleDamageLocation } from "./damageLocations";

export const WARHAMMER_ATTACKER_DAMAGE_DEFAULTS: Omit<
  WarhammerAttackerDamageInput,
  "firstHitLocation"
> = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  alwaysConfirm: false,
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
  const numericFields: Array<
    keyof Omit<
      WarhammerAttackerDamageInput,
      "tearing" | "alwaysConfirm" | "firstHitLocation"
    >
  > = [
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

  // One stored location, so the two selectors cannot disagree and no direct
  // input can select one location of each family.
  const location = values.firstHitLocation;
  const hasLocation =
    isDamageLocation(location) || isVehicleDamageLocation(location);
  if (!hasLocation) {
    errors.firstHitLocation = "Choose a first hit location";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    input: {
      ...(parsed as Omit<
        WarhammerAttackerDamageInput,
        "tearing" | "alwaysConfirm" | "firstHitLocation"
      >),
      alwaysConfirm: values.alwaysConfirm,
      tearing: values.tearing,
      firstHitLocation:
        location as WarhammerAttackerDamageInput["firstHitLocation"],
    },
    errors,
  };
}
