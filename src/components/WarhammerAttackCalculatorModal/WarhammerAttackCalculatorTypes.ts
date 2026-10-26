export type AttackTearing = "none" | "tearing" | "tripleTearing";

export interface AttackCalculatorValues {
  hits: string;
  damageDice: string;
  damageModifier: string;
  penetration: string;
  felling: string;
  proven: string;
  rfOn: string;
  rfConfirmsOn: string;
  tearing: AttackTearing;
}

export interface WarhammerAttackInput {
  hits: number;
  damageDice: number;
  damageModifier: number;
  penetration: number;
  felling: number;
  proven: number;
  rfOn: number;
  rfConfirmsOn: number;
  tearing: AttackTearing;
}

export interface WarhammerAttackDie {
  roll: number;
  damage: number;
}

export interface WarhammerAttackAttempt {
  baseRolls: WarhammerAttackDie[];
  righteousFuryRolls: number[];
  damage: number;
}

export interface WarhammerAttackHit {
  attempts: WarhammerAttackAttempt[];
  selectedAttemptIndex: number;
}

export interface WarhammerAttackResult {
  input: WarhammerAttackInput;
  damages: number[];
  hitDetails: WarhammerAttackHit[];
}

export type AttackCalculatorErrors = Partial<
  Record<keyof AttackCalculatorValues, string>
>;
