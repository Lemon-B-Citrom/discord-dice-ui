import {
  DamageLocation,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderSingleDamageHit,
  WarhammerDefenderVehicleDamageHit,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { ARMOR_SLOT_BY_LOCATION } from "./damageLocations";
import getWarhammerDefenderDamageHitLocation from "./getWarhammerDefenderDamageHitLocation";
import getWarhammerDefenseForLocation, {
  LocationDefense,
} from "./getWarhammerDefenseForLocation";
import { requireSafeInteger } from "./safeInteger";
import getResultsArray from "./getResultsArray";
import LiberImperiumVehicleHitLocation from "./LiberImperiumVehicleHitLocation";

/** Bonus hits get their own Fortitude quota, covering two hits each. */
const BONUS_HITS_PER_FORTITUDE = 2;

const checkedAdd = (left: number, right: number, description: string): number =>
  requireSafeInteger(left + right, description);

const baseHit = (
  request: WarhammerDefenderDamageRequest,
  index: number,
  location: DamageLocation,
  defense: LocationDefense,
  effectiveToughnessBonus: number
) => {
  const armorBeforePenetration = defense.armorBeforePenetration;
  const effectiveArmor = Math.max(
    0,
    requireSafeInteger(
      armorBeforePenetration - request.summary.penetration,
      "Effective armor"
    )
  );
  const damageAfterArmor = requireSafeInteger(
    Math.max(0, request.summary.damages[index] - effectiveArmor),
    "Damage after armor"
  );
  const finalDamage = requireSafeInteger(
    Math.max(0, damageAfterArmor - effectiveToughnessBonus),
    "Final damage"
  );

  return {
    kind: "hit" as const,
    targetFamily: "humanoid" as const,
    index,
    number: index + 1,
    location,
    armorSlot: ARMOR_SLOT_BY_LOCATION[location],
    originalDamage: request.summary.damages[index],
    armorBeforePenetration,
    effectiveArmor,
    showArmorTerm: defense.showArmorTerm,
    effectiveToughnessBonus,
    finalDamage,
  };
};

function calculateWarhammerDefenderDamage(
  request: WarhammerDefenderDamageRequest,
  rollD100: () => number = () => getResultsArray(100)[0]
): WarhammerDefenderDamageResult {
  let totalDamage = 0;
  let totalMagnitude = 0;
  const entries: WarhammerDefenderDamageEntry[] = [];

  if (request.targetFamily === "vehicle") {
    request.summary.damages.forEach((damage, index) => {
      const roll = index === 0 ? undefined : rollD100();
      if (index > 0 && (!Number.isInteger(roll) || roll! < 1 || roll! > 100)) throw new Error("Vehicle hit-location roll must be an integer from 1 to 100");
      const rolledLocation = index === 0 ? request.firstHitLocation : LiberImperiumVehicleHitLocation(roll === 100 ? 0 : roll!);
      if (!rolledLocation) throw new Error("Vehicle hit-location roll must be an integer from 1 to 100");
      const location = rolledLocation;
      const facing = request.vehicleFacing;
      const armorFacing = location === "Turret" ? "Front" : facing;
      const armor = requireSafeInteger(request.vehicleArmor[armorFacing], "Vehicle armor");
      const effectiveArmor = Math.max(0, requireSafeInteger(armor - request.summary.penetration, "Effective armor"));
      const baseDamage = request.summary.baseDamages ? request.summary.baseDamages[index] : damage;
      const extra = requireSafeInteger(damage - baseDamage, "Righteous Fury extra");
      if (extra < 0) throw new Error("Righteous Fury base cannot exceed total damage");
      const baseApplied = Math.max(0, requireSafeInteger(baseDamage - effectiveArmor, "Vehicle base damage after armor"));
      const rfApplied = baseApplied >= 1;
      const finalDamage = requireSafeInteger(
        baseApplied + (rfApplied ? extra : extra > 0 ? 1 : 0),
        "Final vehicle damage"
      );
      totalDamage = checkedAdd(totalDamage, finalDamage, "Total damage");
      const hit: WarhammerDefenderVehicleDamageHit = { kind: "hit", targetFamily: "vehicle", mode: "single", role: "single", index, number: index + 1,
        location, facing, armorFacing, locationRoll: roll, originalDamage: damage,
        baseDamage, righteousFuryExtra: extra, rfApplied, armorBeforePenetration: armor,
        effectiveArmor, finalDamage };
      entries.push(hit);
    });
    return { request, entries, totals: { damage: totalDamage } };
  }

  if (request.targetFamily !== "humanoid") throw new Error("Unsupported damage target");
  request.summary.damages.forEach((_damage, index) => {
    const location = getWarhammerDefenderDamageHitLocation(
      request.firstHitLocation,
      index
    );
    const defense = getWarhammerDefenseForLocation(
      request,
      location,
      ARMOR_SLOT_BY_LOCATION[location]
    );
    // Single-target hits are all true hits, so a negative index covers both.
    const bonusIndex = request.mode === "horde" ? index - request.trueHits : -1;
    // Division keeps the comparison inside the safe integer range.
    const fortitudeApplied =
      bonusIndex < 0
        ? index < request.fortitude
        : Math.floor(bonusIndex / BONUS_HITS_PER_FORTITUDE) <
          request.fortitude;
    // A per-location Toughness add-on joins the Toughness Bonus before
    // Fortitude doubles it, so Felling erodes it and Fortitude doubles it.
    const toughnessBeforeFelling = requireSafeInteger(
      (request.toughnessBonus + defense.toughnessBonusAdd) *
        (fortitudeApplied ? 2 : 1),
      "Toughness before Felling"
    );
    const effectiveToughnessBonus = Math.max(
      0,
      requireSafeInteger(
        toughnessBeforeFelling - request.summary.felling,
        "Effective Toughness Bonus"
      )
    );
    const hit = {
      ...baseHit(request, index, location, defense, effectiveToughnessBonus),
      fortitudeApplied,
      toughnessBeforeFelling,
    };
    totalDamage = checkedAdd(totalDamage, hit.finalDamage, "Total damage");

    if (request.mode === "single") {
      const singleHit: WarhammerDefenderSingleDamageHit = {
        ...hit,
        mode: "single",
        role: "single",
      };
      entries.push(singleHit);
      return;
    }

    const role = index < request.trueHits ? "true" : "bonus";
    let classification: WarhammerDefenderHordeDamageHit["classification"];
    let baseMagnitude: number;
    let devastatingAdded = 0;
    if (role === "bonus") {
      classification = "bonus";
      baseMagnitude = hit.finalDamage > 0 ? 1 : 0;
    } else if (hit.finalDamage <= 0) {
      classification = "no-damage";
      baseMagnitude = 0;
    } else if (hit.finalDamage >= request.woundsPer) {
      classification = "overkill";
      baseMagnitude = request.magPer;
    } else if (hit.finalDamage >= Math.ceil(request.woundsPer / 2)) {
      classification = "partial-overkill";
      baseMagnitude = Math.ceil(request.magPer / 2);
    } else {
      classification = "ordinary";
      baseMagnitude = 1;
    }

    if (role === "true" && baseMagnitude !== 0) {
      devastatingAdded = request.summary.devastating;
    }
    const magnitude = checkedAdd(
      baseMagnitude,
      devastatingAdded,
      "Hit magnitude"
    );
    totalMagnitude = checkedAdd(totalMagnitude, magnitude, "Total magnitude");

    const hordeHit: WarhammerDefenderHordeDamageHit = {
      ...hit,
      mode: "horde",
      role,
      classification,
      baseMagnitude,
      devastatingAdded,
      magnitude,
    };
    entries.push(hordeHit);
  });

  if (request.mode === "single") {
    return { request, entries, totals: { damage: totalDamage } };
  }

  const hasBonusHits = request.trueHits < request.summary.damages.length;
  if (hasBonusHits && request.summary.devastating > 0) {
    const synthetic = {
      kind: "bonus-devastating" as const,
      number: request.summary.damages.length + 1,
      magnitude: request.summary.devastating,
    };
    entries.push(synthetic);
    totalMagnitude = checkedAdd(
      totalMagnitude,
      synthetic.magnitude,
      "Total magnitude"
    );
  }

  const totals =
    request.magPer === 0
      ? {
          damage: totalDamage,
          magnitude: totalMagnitude,
          killCountUnavailable: true,
        }
      : {
          damage: totalDamage,
          magnitude: totalMagnitude,
          killCount: Math.floor(totalMagnitude / request.magPer),
        };

  return { request, entries, totals };
}

export default calculateWarhammerDefenderDamage;
