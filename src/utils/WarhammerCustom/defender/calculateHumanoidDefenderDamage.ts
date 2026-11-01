import {
  DamageLocation,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageResult,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderSingleDamageHit,
  WarhammerHumanoidDamageRequest,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { requireSafeInteger } from "../../safeInteger";
import {
  ARMOR_SLOT_BY_LOCATION,
  getWarhammerDefenderDamageHitLocation,
} from "../shared/damageLocations";
import {
  getWarhammerDefenseForLocation,
  LocationDefense,
} from "./getWarhammerDefenseForLocation";
import { checkedAdd } from "./damageArithmetic";
import { getHordeMagnitudeParts } from "./hordeMagnitude";

const BONUS_HITS_PER_FORTITUDE = 2;

function calculateBaseHit(
  request: WarhammerHumanoidDamageRequest,
  index: number,
  damage: number,
  location: DamageLocation,
  defense: LocationDefense,
  effectiveToughnessBonus: number
) {
  const armorBeforePenetration = defense.armorBeforePenetration;
  const effectiveArmor = Math.max(
    0,
    requireSafeInteger(
      armorBeforePenetration - request.summary.penetration,
      "Effective armor"
    )
  );
  const damageAfterArmor = requireSafeInteger(
    Math.max(0, damage - effectiveArmor),
    "Damage after armor"
  );
  const finalDamage = Math.max(
    0,
    requireSafeInteger(
      damageAfterArmor - effectiveToughnessBonus,
      "Final damage"
    )
  );

  return {
    kind: "hit" as const,
    targetFamily: "humanoid" as const,
    index,
    number: index + 1,
    location,
    armorSlot: ARMOR_SLOT_BY_LOCATION[location],
    originalDamage: damage,
    armorBeforePenetration,
    effectiveArmor,
    showArmorTerm: defense.showArmorTerm,
    effectiveToughnessBonus,
    finalDamage,
  };
}

/** Calculate humanoid damage and optional Horde magnitude. */
export function calculateHumanoidDefenderDamage(
  request: WarhammerHumanoidDamageRequest
): WarhammerDefenderDamageResult {
  const entries: WarhammerDefenderDamageEntry[] = [];
  let totalDamage = 0;
  let totalMagnitude = 0;

  for (let index = 0; index < request.summary.damages.length; index += 1) {
    const damage = request.summary.damages[index];
    const location = getWarhammerDefenderDamageHitLocation(
      request.firstHitLocation,
      index
    );
    const defense = getWarhammerDefenseForLocation(
      request,
      location,
      ARMOR_SLOT_BY_LOCATION[location]
    );
    let hordeRole: "true" | "bonus" | null = null;
    if (request.mode === "horde") {
      hordeRole = index < request.trueHits ? "true" : "bonus";
    }
    const isBonusHit = hordeRole === "bonus";
    let fortitudeIndex = index;
    if (isBonusHit && request.mode === "horde") {
      fortitudeIndex = index - request.trueHits;
    }
    const fortitudeApplied = isBonusHit
      ? Math.floor(fortitudeIndex / BONUS_HITS_PER_FORTITUDE) <
        request.fortitude
      : index < request.fortitude;
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
    const baseHit = calculateBaseHit(
      request,
      index,
      damage,
      location,
      defense,
      effectiveToughnessBonus
    );
    totalDamage = checkedAdd(totalDamage, baseHit.finalDamage, "Total damage");

    const hitBase = { ...baseHit, fortitudeApplied, toughnessBeforeFelling };
    if (request.mode === "single") {
      const singleHit: WarhammerDefenderSingleDamageHit = {
        ...hitBase,
        mode: "single",
        role: "single",
      };
      entries.push(singleHit);
      continue;
    }

    const role = hordeRole as "true" | "bonus";
    const magnitudeParts = getHordeMagnitudeParts(
      role,
      baseHit.finalDamage,
      request.woundsPer,
      request.magPer,
      request.summary.devastating
    );
    const hordeHit: WarhammerDefenderHordeDamageHit = {
      ...hitBase,
      mode: "horde",
      role,
      ...magnitudeParts,
      magnitude: checkedAdd(
        magnitudeParts.baseMagnitude,
        magnitudeParts.devastatingAdded,
        "Hit magnitude"
      ),
    };
    totalMagnitude = checkedAdd(
      totalMagnitude,
      hordeHit.magnitude,
      "Total magnitude"
    );
    entries.push(hordeHit);
  }

  if (request.mode === "single") {
    return { request, entries, totals: { damage: totalDamage } };
  }

  const hasBonusHits = request.trueHits < request.summary.damages.length;
  if (hasBonusHits && request.summary.devastating > 0) {
    entries.push({
      kind: "bonus-devastating",
      number: request.summary.damages.length + 1,
      magnitude: request.summary.devastating,
    });
    totalMagnitude = checkedAdd(
      totalMagnitude,
      request.summary.devastating,
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
