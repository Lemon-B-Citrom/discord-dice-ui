import { WarhammerDefenderHordeDamageHit } from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "../../safeInteger";

type HordeRole = WarhammerDefenderHordeDamageHit["role"];

export interface HordeMagnitudeParts {
  classification: WarhammerDefenderHordeDamageHit["classification"];
  baseMagnitude: number;
  devastatingAdded: number;
}

/** Classify one Horde hit and derive its magnitude contribution. */
export function getHordeMagnitudeParts(
  role: HordeRole,
  damage: number,
  woundsPer: number,
  magnitudePerUnit: number,
  devastating: number
): HordeMagnitudeParts {
  let classification: HordeMagnitudeParts["classification"];
  let baseMagnitude: number;

  if (role === "bonus") {
    classification = "bonus";
    baseMagnitude = damage > 0 ? 1 : 0;
  } else if (damage <= 0) {
    classification = "no-damage";
    baseMagnitude = 0;
  } else if (damage >= woundsPer) {
    classification = "overkill";
    baseMagnitude = magnitudePerUnit;
  } else if (damage >= Math.ceil(woundsPer / 2)) {
    classification = "partial-overkill";
    baseMagnitude = Math.ceil(magnitudePerUnit / 2);
  } else {
    classification = "ordinary";
    baseMagnitude = 1;
  }

  const devastatingAdded =
    role === "true" && baseMagnitude !== 0 ? devastating : 0;
  return {
    classification,
    baseMagnitude,
    devastatingAdded: requireSafeInteger(
      devastatingAdded,
      "Devastating magnitude"
    ),
  };
}
