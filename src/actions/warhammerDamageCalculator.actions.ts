import {
  DamageValidationErrors,
  WarhammerDamageDraft,
  WarhammerDamageResult,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";

export const WARHAMMER_DAMAGE_DRAFT_CHANGED = "WARHAMMER_DAMAGE_DRAFT_CHANGED";
export const WARHAMMER_DAMAGE_DRAFT_CLEARED = "WARHAMMER_DAMAGE_DRAFT_CLEARED";
export const WARHAMMER_DAMAGE_REQUESTED = "WARHAMMER_DAMAGE_REQUESTED";
export const WARHAMMER_DAMAGE_RESULTS_SAVED = "WARHAMMER_DAMAGE_RESULTS_SAVED";
export const WARHAMMER_DAMAGE_FAILED = "WARHAMMER_DAMAGE_FAILED";
export const WARHAMMER_DAMAGE_BACK_TO_FORM = "WARHAMMER_DAMAGE_BACK_TO_FORM";

export type DamageDraftField = keyof WarhammerDamageDraft;

export function changeWarhammerDamageDraft(
  field: DamageDraftField,
  value: string
) {
  return { type: WARHAMMER_DAMAGE_DRAFT_CHANGED, payload: { field, value } };
}

export function clearWarhammerDamageDraft() {
  return { type: WARHAMMER_DAMAGE_DRAFT_CLEARED };
}

export function requestWarhammerDamage(payload: WarhammerDamageDraft) {
  return { type: WARHAMMER_DAMAGE_REQUESTED, payload: { ...payload } };
}

export function saveWarhammerDamageResults(payload: WarhammerDamageResult) {
  return { type: WARHAMMER_DAMAGE_RESULTS_SAVED, payload };
}

export function failWarhammerDamage(errors: DamageValidationErrors) {
  return { type: WARHAMMER_DAMAGE_FAILED, payload: errors };
}

export function backToWarhammerDamageForm() {
  return { type: WARHAMMER_DAMAGE_BACK_TO_FORM };
}
