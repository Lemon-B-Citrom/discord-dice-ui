import {
  ArmorSlot,
  DamageLocation,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderSingleDamageHit,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import getWarhammerDefenderDamageHitLocation from "./getWarhammerDefenderDamageHitLocation";
import { requireSafeInteger } from "./safeInteger";

const getArmorSlot = (location: DamageLocation): ArmorSlot => {
  switch (location) {
    case "Head":
      return "headAP";
    case "Body":
      return "bodyAP";
    case "Left Arm":
    case "Right Arm":
      return "armsAP";
    case "Left Leg":
    case "Right Leg":
      return "legsAP";
  }
};

const checkedAdd = (left: number, right: number, description: string): number =>
  requireSafeInteger(left + right, description);

const baseHit = (
  request: WarhammerDefenderDamageRequest,
  index: number,
  effectiveToughnessBonus: number
) => {
  const location = getWarhammerDefenderDamageHitLocation(request.firstHitLocation, index);
  const armorSlot = getArmorSlot(location);
  const armorBeforePenetration = request.armor[armorSlot];
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
    armorSlot,
    originalDamage: request.summary.damages[index],
    armorBeforePenetration,
    effectiveArmor,
    showArmorTerm: request.armor.sources[armorSlot] !== "omitted",
    effectiveToughnessBonus,
    finalDamage,
  };
};

function calculateWarhammerDefenderDamage(
  draft: WarhammerDefenderDamageDraft,
  request: WarhammerDefenderDamageRequest
): WarhammerDefenderDamageResult {
  let totalDamage = 0;
  let totalMagnitude = 0;
  const entries: WarhammerDefenderDamageEntry[] = request.summary.damages.map(
    (_damage, index) => {
      const bonusIndex = request.mode === "horde" ? index - request.trueHits : -1;
      // Bonus hits have an independent 2N quota; division avoids overflowing 2N.
      const fortitudeApplied =
        request.mode === "single" || bonusIndex < 0
          ? index < request.fortitude
          : Math.floor(bonusIndex / 2) < request.fortitude;
      const toughnessBeforeFelling = requireSafeInteger(
        request.toughnessBonus * (fortitudeApplied ? 2 : 1),
        "Toughness before Felling"
      );
      const effectiveToughnessBonus = Math.max(0, requireSafeInteger(
        toughnessBeforeFelling - request.summary.felling,
        "Effective Toughness Bonus"
      ));
      const hit = {
        ...baseHit(request, index, effectiveToughnessBonus),
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
        return singleHit;
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
      return hordeHit;
    }
  );

  if (request.mode === "single") {
    return {
      draft: { ...draft },
      request,
      entries,
      totals: { damage: totalDamage },
    };
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

  return {
    draft: { ...draft },
    request,
    entries,
    totals,
  };
}

export default calculateWarhammerDefenderDamage;
