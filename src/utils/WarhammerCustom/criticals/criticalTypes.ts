export type CriticalFamily = "humanoid" | "vehicle";

export type HumanoidCriticalLocation = "head" | "body" | "arm" | "leg";
export type VehicleCriticalLocation =
  | "motiveSystem"
  | "hull"
  | "weapon"
  | "turret";
export type CriticalLocation =
  | HumanoidCriticalLocation
  | VehicleCriticalLocation;

export type CriticalDamageType = "Energy" | "Explosive" | "Impact" | "Rending";
export type CriticalSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface CriticalLocationOption {
  readonly id: CriticalLocation;
  readonly label: string;
}

export interface CriticalLocationGroup {
  readonly family: CriticalFamily;
  readonly label: string;
  readonly locations: ReadonlyArray<CriticalLocationOption>;
}

export interface CriticalTableRow {
  readonly severity: CriticalSeverity;
  readonly rowLabel: string;
  readonly text: string;
  readonly source: string;
  readonly prerequisiteSeverity?: CriticalSeverity;
}

export interface CriticalTable {
  readonly family: CriticalFamily;
  readonly location: CriticalLocation;
  readonly damageType?: CriticalDamageType;
  readonly rows: ReadonlyArray<CriticalTableRow>;
}

export interface WarhammerCriticalRequest {
  readonly severity: CriticalSeverity;
  readonly family: CriticalFamily;
  readonly location: CriticalLocation;
  readonly damageType?: CriticalDamageType;
}

export interface CriticalEffect extends CriticalTableRow {
  readonly damageType?: CriticalDamageType;
}

export interface WarhammerCriticalResult {
  readonly request: WarhammerCriticalRequest;
  readonly table: CriticalTable;
  readonly effect: CriticalEffect;
  readonly prerequisites: ReadonlyArray<CriticalEffect>;
}

export interface CriticalStatusRoll {
  readonly start: number;
  readonly end: number;
  readonly entryNumber: number;
  readonly expression: string;
  readonly dice: ReadonlyArray<number>;
  readonly result: number;
  readonly effect?: string;
  readonly unit?: string;
  readonly condition?: string;
}

export interface CriticalManualCheck {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly entryNumber: number;
  readonly condition?: string;
}

export interface ResolvedCriticalSection {
  readonly effect: CriticalEffect;
  readonly statusRolls: ReadonlyArray<CriticalStatusRoll>;
  readonly checks: ReadonlyArray<CriticalManualCheck>;
}

export interface ResolvedWarhammerCriticalResult extends WarhammerCriticalResult {
  readonly resolvedSections: ReadonlyArray<ResolvedCriticalSection>;
}

export interface CriticalValidationErrors {
  readonly damage?: string;
  readonly form?: string;
}

export type CriticalNormalization =
  | { readonly request: WarhammerCriticalRequest; readonly errors: {} }
  | { readonly request: null; readonly errors: CriticalValidationErrors };
