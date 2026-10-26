export type DamageLocation =
  | "Head"
  | "Body"
  | "Left Arm"
  | "Right Arm"
  | "Left Leg"
  | "Right Leg";

export interface WarhammerDamageDraft {
  attackSummaryString: string;
  toughnessBonus: string;
  fortitude: string;
  armorHead: string;
  armorBody: string;
  armorArms: string;
  armorLegs: string;
  firstHitLocation: string;
  trueHits: string;
  magPer: string;
  devastating: string;
  woundsPer: string;
}

export const EMPTY_DAMAGE_DRAFT: WarhammerDamageDraft = {
  attackSummaryString: "",
  toughnessBonus: "",
  fortitude: "",
  armorHead: "",
  armorBody: "",
  armorArms: "",
  armorLegs: "",
  firstHitLocation: "",
  trueHits: "",
  magPer: "",
  devastating: "",
  woundsPer: "",
};

export interface WarhammerAttackSummary {
  penetration: number;
  felling: number;
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

export interface DamageValidationIssue {
  field: keyof WarhammerDamageDraft | "form";
  message: string;
}

export type DamageValidationErrors = Partial<
  Record<keyof WarhammerDamageDraft, string>
> & { form?: string };

export interface WarhammerDamageCommonRequest {
  mode: "single" | "horde";
  summary: WarhammerAttackSummary;
  toughnessBonus: number;
  fortitude: number;
  armor: WarhammerArmorLayout;
  firstHitLocation: DamageLocation;
}

export interface WarhammerSingleDamageRequest
  extends WarhammerDamageCommonRequest {
  mode: "single";
}

export interface WarhammerHordeDamageRequest
  extends WarhammerDamageCommonRequest {
  mode: "horde";
  trueHits: number;
  magPer: number;
  devastating: number;
  woundsPer: number;
}

export type WarhammerDamageRequest =
  | WarhammerSingleDamageRequest
  | WarhammerHordeDamageRequest;

export interface DamageEntryBase {
  kind: "hit";
  index: number;
  number: number;
  location: DamageLocation;
  armorSlot: "headAP" | "bodyAP" | "armsAP" | "legsAP";
  originalDamage: number;
  armorBeforePenetration: number;
  effectiveArmor: number;
  showArmorTerm: boolean;
  effectiveToughnessBonus: number;
  fortitudeApplied: boolean;
  toughnessBeforeFelling: number;
  finalDamage: number;
}

export interface WarhammerSingleDamageHit extends DamageEntryBase {
  mode: "single";
  role: "single";
}

export type HordeDamageClassification =
  | "overkill"
  | "partial-overkill"
  | "ordinary"
  | "no-damage"
  | "bonus";

export interface WarhammerHordeDamageHit extends DamageEntryBase {
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

export type WarhammerDamageEntry =
  | WarhammerSingleDamageHit
  | WarhammerHordeDamageHit
  | WarhammerBonusDevastatingEntry;

export interface WarhammerDamageTotals {
  damage: number;
  magnitude?: number;
  killCount?: number;
  killCountUnavailable?: boolean;
}

export interface WarhammerDamageResult {
  draft: WarhammerDamageDraft;
  request: WarhammerDamageRequest;
  entries: WarhammerDamageEntry[];
  totals: WarhammerDamageTotals;
}

export type NormalizeDamageResult =
  | { request: WarhammerDamageRequest; errors: DamageValidationErrors }
  | { request: null; errors: DamageValidationErrors };
