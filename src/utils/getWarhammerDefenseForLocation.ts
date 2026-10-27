import {
  ArmorSlot,
  DamageLocation,
  WarhammerDefenderDamageRequest,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

export interface LocationDefense {
  /** Armor of the body part before any Penetration is applied. */
  armorBeforePenetration: number;
  /** Whether the damage equation shows an Armor term at all. */
  showArmorTerm: boolean;
  /** Per-location Toughness added to the Toughness Bonus before doubling. */
  toughnessBonusAdd: number;
}

/**
 * Single owner of the mapping from a body part to the defenses that apply to it,
 * for both the calculator and the equation labels, so the simple slot rules and
 * the advanced overrides cannot disagree.
 */
export default function getWarhammerDefenseForLocation(
  request: WarhammerDefenderDamageRequest,
  location: DamageLocation,
  armorSlot: ArmorSlot
): LocationDefense {
  const defenses = request.defenses;
  if (defenses.mode === "advanced") {
    const armorBeforePenetration = defenses.armor[location];
    return {
      armorBeforePenetration,
      // A zero override reads better as no Armor term than as Armor (0).
      showArmorTerm: armorBeforePenetration > 0,
      toughnessBonusAdd: defenses.toughnessBonus[location],
    };
  }

  return {
    armorBeforePenetration: defenses.armor[armorSlot],
    showArmorTerm: defenses.armor.sources[armorSlot] !== "omitted",
    toughnessBonusAdd: 0,
  };
}
