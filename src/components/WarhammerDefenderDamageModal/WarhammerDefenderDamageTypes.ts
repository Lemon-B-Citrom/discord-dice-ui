export const DAMAGE_LOCATIONS = [
  "Head",
  "Body",
  "Left Arm",
  "Right Arm",
  "Left Leg",
  "Right Leg",
] as const;

export type DamageLocation = typeof DAMAGE_LOCATIONS[number];

export type ArmorSlot = "headAP" | "bodyAP" | "armsAP" | "legsAP";

export type AdvancedArmorField =
  | "advancedArmorHead"
  | "advancedArmorBody"
  | "advancedArmorLeftArm"
  | "advancedArmorRightArm"
  | "advancedArmorLeftLeg"
  | "advancedArmorRightLeg";

export type AdvancedToughnessField =
  | "advancedToughnessHead"
  | "advancedToughnessBody"
  | "advancedToughnessLeftArm"
  | "advancedToughnessRightArm"
  | "advancedToughnessLeftLeg"
  | "advancedToughnessRightLeg";

export type AdvancedDefenseField = AdvancedArmorField | AdvancedToughnessField;

export interface WarhammerDefenderDamageDraft {
  attackSummaryString: string;
  toughnessBonus: string;
  fortitude: string;
  armorHead: string;
  armorBody: string;
  armorArms: string;
  armorLegs: string;
  firstHitLocation: string;
  /** Hits beyond the true hits; blank is the default of zero bonus hits. */
  bonusHits: string;
  magPer: string;
  woundsPer: string;
  hordeEnabled: boolean;
  advancedEnabled: boolean;
  advancedArmorHead: string;
  advancedArmorBody: string;
  advancedArmorLeftArm: string;
  advancedArmorRightArm: string;
  advancedArmorLeftLeg: string;
  advancedArmorRightLeg: string;
  advancedToughnessHead: string;
  advancedToughnessBody: string;
  advancedToughnessLeftArm: string;
  advancedToughnessRightArm: string;
  advancedToughnessLeftLeg: string;
  advancedToughnessRightLeg: string;
}

export const EMPTY_DEFENDER_DAMAGE_DRAFT: WarhammerDefenderDamageDraft = {
  attackSummaryString: "",
  toughnessBonus: "",
  fortitude: "",
  armorHead: "",
  armorBody: "",
  armorArms: "",
  armorLegs: "",
  firstHitLocation: "",
  bonusHits: "",
  magPer: "",
  woundsPer: "",
  hordeEnabled: false,
  advancedEnabled: false,
  advancedArmorHead: "",
  advancedArmorBody: "",
  advancedArmorLeftArm: "",
  advancedArmorRightArm: "",
  advancedArmorLeftLeg: "",
  advancedArmorRightLeg: "",
  advancedToughnessHead: "",
  advancedToughnessBody: "",
  advancedToughnessLeftArm: "",
  advancedToughnessRightArm: "",
  advancedToughnessLeftLeg: "",
  advancedToughnessRightLeg: "",
};

export interface WarhammerAttackerDamageSummary {
  penetration: number;
  felling: number;
  devastating: number;
  damages: number[];
}

export type ArmorSource =
  | "explicit"
  | "body"
  | "other-part"
  | "omitted";

export interface WarhammerArmorLayout {
  headAP: number;
  bodyAP: number;
  armsAP: number;
  legsAP: number;
  sources: {
    headAP: ArmorSource;
    bodyAP: ArmorSource;
    armsAP: ArmorSource;
    legsAP: ArmorSource;
  };
}

/** Per-body-part armor and Toughness add-ons used by advanced defenses. */
export interface WarhammerAdvancedDefenses {
  armor: Record<DamageLocation, number>;
  toughnessBonus: Record<DamageLocation, number>;
}

/**
 * Exactly one source of armor and Toughness per request: the four inherited
 * slots, or the six per-location overrides.
 */
export type WarhammerDefenderDefenses =
  | { mode: "simple"; armor: WarhammerArmorLayout }
  | ({ mode: "advanced" } & WarhammerAdvancedDefenses);

export type DefenderDamageValidationErrors = Partial<
  Record<keyof WarhammerDefenderDamageDraft, string>
> & { form?: string };

export interface WarhammerDefenderDamageCommonRequest {
  mode: "single" | "horde";
  summary: WarhammerAttackerDamageSummary;
  toughnessBonus: number;
  fortitude: number;
  defenses: WarhammerDefenderDefenses;
  firstHitLocation: DamageLocation;
}

export interface WarhammerDefenderSingleDamageRequest
  extends WarhammerDefenderDamageCommonRequest {
  mode: "single";
}

export interface WarhammerDefenderHordeDamageRequest
  extends WarhammerDefenderDamageCommonRequest {
  mode: "horde";
  /** Derived from the summary: every hit that is not a bonus hit. */
  trueHits: number;
  magPer: number;
  // Devastating is owned by the attack summary, not by this request.
  woundsPer: number;
}

export type WarhammerDefenderDamageRequest =
  | WarhammerDefenderSingleDamageRequest
  | WarhammerDefenderHordeDamageRequest;

export interface DefenderDamageEntryBase {
  kind: "hit";
  index: number;
  number: number;
  location: DamageLocation;
  armorSlot: ArmorSlot;
  originalDamage: number;
  armorBeforePenetration: number;
  effectiveArmor: number;
  showArmorTerm: boolean;
  effectiveToughnessBonus: number;
  fortitudeApplied: boolean;
  toughnessBeforeFelling: number;
  finalDamage: number;
}

export interface WarhammerDefenderSingleDamageHit extends DefenderDamageEntryBase {
  mode: "single";
  role: "single";
}

export type HordeDamageClassification =
  | "overkill"
  | "partial-overkill"
  | "ordinary"
  | "no-damage"
  | "bonus";

export interface WarhammerDefenderHordeDamageHit extends DefenderDamageEntryBase {
  mode: "horde";
  role: "true" | "bonus";
  classification: HordeDamageClassification;
  baseMagnitude: number;
  devastatingAdded: number;
  magnitude: number;
}

export interface WarhammerBonusDevastatingEntry {
  kind: "bonus-devastating";
  number: number;
  magnitude: number;
}

export type WarhammerDefenderDamageHit =
  | WarhammerDefenderSingleDamageHit
  | WarhammerDefenderHordeDamageHit;

export type WarhammerDefenderDamageEntry =
  | WarhammerDefenderDamageHit
  | WarhammerBonusDevastatingEntry;

export interface WarhammerDefenderDamageTotals {
  damage: number;
  magnitude?: number;
  killCount?: number;
  killCountUnavailable?: boolean;
}

export interface WarhammerDefenderDamageResult {
  request: WarhammerDefenderDamageRequest;
  entries: WarhammerDefenderDamageEntry[];
  totals: WarhammerDefenderDamageTotals;
}

export type NormalizeDefenderDamageResult =
  | { request: WarhammerDefenderDamageRequest; errors: DefenderDamageValidationErrors }
  | { request: null; errors: DefenderDamageValidationErrors };
