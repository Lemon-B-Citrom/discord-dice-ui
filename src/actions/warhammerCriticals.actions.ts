import {
  CriticalFamily,
  CriticalLocation,
  CriticalValidationErrors,
  WarhammerCriticalRequest,
  ResolvedWarhammerCriticalResult,
} from "../utils/WarhammerCustom/criticals/criticalTypes";

export const WARHAMMER_CRITICAL_DAMAGE_CHANGED =
  "WARHAMMER_CRITICAL_DAMAGE_CHANGED";
export const WARHAMMER_CRITICAL_LOCATION_SELECTED =
  "WARHAMMER_CRITICAL_LOCATION_SELECTED";
export const WARHAMMER_CRITICAL_REQUESTED = "WARHAMMER_CRITICAL_REQUESTED";
export const WARHAMMER_CRITICAL_RESULTS_SAVED =
  "WARHAMMER_CRITICAL_RESULTS_SAVED";
export const WARHAMMER_CRITICAL_FAILED = "WARHAMMER_CRITICAL_FAILED";
export const WARHAMMER_CRITICAL_SEND_WARNED = "WARHAMMER_CRITICAL_SEND_WARNED";
export const WARHAMMER_CRITICAL_BACK_TO_FORM = "WARHAMMER_CRITICAL_BACK_TO_FORM";
export const WARHAMMER_CRITICAL_RESULTS_CLOSED =
  "WARHAMMER_CRITICAL_RESULTS_CLOSED";

export interface WarhammerCriticalSelection {
  readonly family: CriticalFamily;
  readonly location: CriticalLocation;
}

export interface WarhammerCriticalRequestInput extends WarhammerCriticalSelection {
  readonly rawDamage: string;
  readonly damageType?: WarhammerCriticalRequest["damageType"];
}

export function changeWarhammerCriticalDamage(rawDamage: string) {
  return { type: WARHAMMER_CRITICAL_DAMAGE_CHANGED, payload: rawDamage };
}

export function selectWarhammerCriticalLocation(
  selection: WarhammerCriticalSelection
) {
  return { type: WARHAMMER_CRITICAL_LOCATION_SELECTED, payload: selection };
}

export function requestWarhammerCritical(payload: WarhammerCriticalRequestInput) {
  return { type: WARHAMMER_CRITICAL_REQUESTED, payload };
}

export function saveWarhammerCriticalResults(
  payload: ResolvedWarhammerCriticalResult
) {
  return { type: WARHAMMER_CRITICAL_RESULTS_SAVED, payload };
}

export function failWarhammerCritical(errors: CriticalValidationErrors) {
  return { type: WARHAMMER_CRITICAL_FAILED, payload: errors };
}

export function warnWarhammerCriticalSend(message: string) {
  return { type: WARHAMMER_CRITICAL_SEND_WARNED, payload: message };
}

export function backToWarhammerCriticalsForm() {
  return { type: WARHAMMER_CRITICAL_BACK_TO_FORM };
}

export function closeWarhammerCriticalsResultsModal() {
  return { type: WARHAMMER_CRITICAL_RESULTS_CLOSED };
}
