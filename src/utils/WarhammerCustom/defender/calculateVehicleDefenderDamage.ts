import {
  VehicleDamageLocation,
  WarhammerDefenderDamageResult,
  WarhammerDefenderVehicleDamageHit,
  WarhammerDefenderVehicleDamageRequest,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "../../safeInteger";
import { checkedAdd, getVehicleDamageParts } from "./damageArithmetic";
import { getVehicleHitLocation } from "./vehicleHitLocation";
import { requireRighteousFuryExtra } from "../shared/righteousFury";

function rollVehicleLocation(rollD100: () => number): number {
  const roll = rollD100();
  if (!Number.isInteger(roll) || roll < 1 || roll > 100) {
    throw new Error(
      "Vehicle hit-location roll must be an integer from 1 to 100"
    );
  }
  return roll;
}

function getLocationForRoll(roll: number): VehicleDamageLocation {
  const location = getVehicleHitLocation(roll === 100 ? 0 : roll);
  if (!location) {
    throw new Error(`Vehicle hit-location roll ${roll} matched no location`);
  }
  return location;
}

function resolveVehicleLocation(
  index: number,
  firstHitLocation: VehicleDamageLocation,
  rollD100: () => number
): { location: VehicleDamageLocation; roll?: number } {
  if (index === 0) return { location: firstHitLocation };
  const roll = rollVehicleLocation(rollD100);
  return { location: getLocationForRoll(roll), roll };
}

/** Calculate vehicle armor damage, drawing a fresh location for each later hit. */
export function calculateVehicleDefenderDamage(
  request: WarhammerDefenderVehicleDamageRequest,
  rollD100: () => number
): WarhammerDefenderDamageResult {
  const entries: WarhammerDefenderVehicleDamageHit[] = [];
  let totalDamage = 0;

  for (let index = 0; index < request.summary.damages.length; index += 1) {
    const damage = request.summary.damages[index];
    const { location: rolledLocation, roll } = resolveVehicleLocation(
      index,
      request.firstHitLocation,
      rollD100
    );
    const location =
      rolledLocation === "Turret" && !request.hasTurret
        ? "Hull"
        : rolledLocation;
    const facing = request.vehicleFacing;
    const armorFacing = location === "Turret" ? "Front" : facing;
    const armor = requireSafeInteger(
      request.vehicleArmor[armorFacing],
      "Vehicle armor"
    );
    const effectiveArmor = Math.max(
      0,
      requireSafeInteger(armor - request.summary.penetration, "Effective armor")
    );
    const baseDamage = request.summary.baseDamages?.[index] ?? damage;
    const furyExtra = requireRighteousFuryExtra(damage, baseDamage);
    if (furyExtra < 0) {
      throw new Error("Righteous Fury base cannot exceed the total damage");
    }
    const { rfApplied, damage: finalDamage } = getVehicleDamageParts(
      baseDamage,
      effectiveArmor,
      furyExtra
    );
    totalDamage = checkedAdd(totalDamage, finalDamage, "Total damage");
    entries.push({
      kind: "hit",
      targetFamily: "vehicle",
      mode: "single",
      role: "single",
      index,
      number: index + 1,
      location,
      facing,
      armorFacing,
      locationRoll: roll,
      originalDamage: damage,
      baseDamage,
      righteousFuryExtra: furyExtra,
      rfApplied,
      armorBeforePenetration: armor,
      effectiveArmor,
      finalDamage,
    });
  }

  return { request, entries, totals: { damage: totalDamage } };
}
