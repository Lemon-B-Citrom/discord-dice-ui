import {
  DamageLocation,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderSingleDamageHit,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { ARMOR_SLOT_BY_LOCATION } from "./damageLocations";
import getWarhammerDefenderDamageHitLocation from "./getWarhammerDefenderDamageHitLocation";
import getWarhammerDefenseForLocation, {
  LocationDefense,
} from "./getWarhammerDefenseForLocation";
import { requireSafeInteger } from "./safeInteger";

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
  request: WarhammerDefenderDamageRequest
): WarhammerDefenderDamageResult {
  let totalDamage = 0;
  let totalMagnitude = 0;
  const entries: WarhammerDefenderDamageEntry[] = [];

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
