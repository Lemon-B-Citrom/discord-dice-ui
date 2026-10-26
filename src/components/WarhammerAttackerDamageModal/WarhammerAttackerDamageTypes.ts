export type AttackerDamageTearing = "none" | "tearing" | "tripleTearing";

export interface AttackerDamageValues {
  hits: string;
  damageDice: string;
  damageModifier: string;
  penetration: string;
  felling: string;
  devastating: string;
  proven: string;
  rfOn: string;
  rfConfirmsOn: string;
  tearing: AttackerDamageTearing;
}

export interface WarhammerAttackerDamageInput {
  hits: number;
  damageDice: number;
  damageModifier: number;
  penetration: number;
  felling: number;
  devastating: number;
  proven: number;
  rfOn: number;
  rfConfirmsOn: number;
  tearing: AttackerDamageTearing;
}

export interface WarhammerAttackerDamageDie {
  roll: number;
  damage: number;
}

export interface WarhammerAttackerDamageAttempt {
  baseRolls: WarhammerAttackerDamageDie[];
  righteousFuryRolls: number[];
  damage: number;
}

export interface WarhammerAttackerDamageHit {
  attempts: WarhammerAttackerDamageAttempt[];
  selectedAttemptIndex: number;
}

export interface WarhammerAttackerDamageResult {
  input: WarhammerAttackerDamageInput;
  damages: number[];
  hitDetails: WarhammerAttackerDamageHit[];
}

export type AttackerDamageErrors = Partial<
  Record<keyof AttackerDamageValues, string>
>;
