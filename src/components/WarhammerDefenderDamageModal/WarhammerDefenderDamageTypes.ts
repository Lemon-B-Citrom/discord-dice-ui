export const DAMAGE_LOCATIONS = [
  "Head",
  "Body",
  "Left Arm",
  "Right Arm",
  "Left Leg",
  "Right Leg",
] as const;

export type DamageLocation = typeof DAMAGE_LOCATIONS[number];
export const VEHICLE_DAMAGE_LOCATIONS = [
  "Motive Systems",
  "Hull",
  "Weapons",
  "Turret",
] as const;
export type VehicleDamageLocation = typeof VEHICLE_DAMAGE_LOCATIONS[number];
export type AnyDamageLocation = DamageLocation | VehicleDamageLocation;
export const VEHICLE_FACINGS = ["Front", "Side", "Rear"] as const;
export type VehicleFacing = typeof VEHICLE_FACINGS[number];

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
  /** Hits beyond the true hits; blank is the default of zero bonus hits. */
  bonusHits: string;
  magPer: string;
  woundsPer: string;
  hordeEnabled: boolean;
  advancedEnabled: boolean;
  armorFront: string;
  armorSide: string;
  armorRear: string;
  facing: string;
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
  bonusHits: "",
  magPer: "",
  woundsPer: "",
  hordeEnabled: false,
  advancedEnabled: false,
  armorFront: "",
  armorSide: "",
  armorRear: "",
  facing: "",
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
  firstHitLocation: AnyDamageLocation;
  damages: number[];
  baseDamages?: number[];
}

export type ArmorSource = "explicit" | "body" | "other-part" | "omitted";

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
  summary: WarhammerAttackerDamageSummary;
  firstHitLocation: AnyDamageLocation;
}

export interface WarhammerHumanoidDamageRequestBase
  extends WarhammerDefenderDamageCommonRequest {
  targetFamily: "humanoid";
  firstHitLocation: DamageLocation;
  toughnessBonus: number;
  fortitude: number;
  defenses: WarhammerDefenderDefenses;
}

export interface WarhammerDefenderSingleDamageRequest
  extends WarhammerHumanoidDamageRequestBase {
  mode: "single";
}

export interface WarhammerDefenderHordeDamageRequest
  extends WarhammerHumanoidDamageRequestBase {
  mode: "horde";
  /** Derived from the summary: every hit that is not a bonus hit. */
  trueHits: number;
  magPer: number;
  // Devastating is owned by the attack summary, not by this request.
  woundsPer: number;
}

export interface WarhammerDefenderVehicleDamageRequest
  extends WarhammerDefenderDamageCommonRequest {
  targetFamily: "vehicle";
  mode: "single";
  firstHitLocation: VehicleDamageLocation;
  vehicleFacing: VehicleFacing;
  vehicleArmor: Record<VehicleFacing, number>;
}

export type WarhammerDefenderDamageRequest =
  | WarhammerDefenderSingleDamageRequest
  | WarhammerDefenderHordeDamageRequest
  | WarhammerDefenderVehicleDamageRequest;

export type WarhammerHumanoidDamageRequest =
  | WarhammerDefenderSingleDamageRequest
  | WarhammerDefenderHordeDamageRequest;

export interface DefenderDamageEntryBase<
  L extends AnyDamageLocation = AnyDamageLocation
> {
  kind: "hit";
  index: number;
  number: number;
  location: L;
  originalDamage: number;
  armorBeforePenetration: number;
  effectiveArmor: number;
  finalDamage: number;
}

export interface WarhammerHumanoidDamageHitBase
  extends DefenderDamageEntryBase<DamageLocation> {
  targetFamily: "humanoid";
  armorSlot: ArmorSlot;
  showArmorTerm: boolean;
  effectiveToughnessBonus: number;
  fortitudeApplied: boolean;
  toughnessBeforeFelling: number;
}

export interface WarhammerDefenderSingleDamageHit
  extends WarhammerHumanoidDamageHitBase {
  mode: "single";
  role: "single";
}

export type HordeDamageClassification =
  | "overkill"
  | "partial-overkill"
  | "ordinary"
  | "no-damage"
  | "bonus";

export interface WarhammerDefenderHordeDamageHit
  extends WarhammerHumanoidDamageHitBase {
  mode: "horde";
  role: "true" | "bonus";
  classification: HordeDamageClassification;
  baseMagnitude: number;
  devastatingAdded: number;
  magnitude: number;
}

export interface WarhammerDefenderVehicleDamageHit
  extends DefenderDamageEntryBase<VehicleDamageLocation> {
  targetFamily: "vehicle";
  mode: "single";
  role: "single";
  facing: VehicleFacing;
  armorFacing: VehicleFacing;
  locationRoll?: number;
  baseDamage: number;
  righteousFuryExtra: number;
  rfApplied: boolean;
}

export interface WarhammerBonusDevastatingEntry {
  kind: "bonus-devastating";
  number: number;
  magnitude: number;
}

/** The two humanoid hit branches, which share every Toughness and armor slot. */
export type WarhammerHumanoidDamageHit =
  | WarhammerDefenderSingleDamageHit
  | WarhammerDefenderHordeDamageHit;

export type WarhammerDefenderDamageHit =
  | WarhammerHumanoidDamageHit
  | WarhammerDefenderVehicleDamageHit;

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
  | {
      request: WarhammerDefenderDamageRequest;
      errors: DefenderDamageValidationErrors;
    }
  | { request: null; errors: DefenderDamageValidationErrors };
