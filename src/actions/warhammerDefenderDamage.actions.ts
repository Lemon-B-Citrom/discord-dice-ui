import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageResult,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

export const WARHAMMER_DEFENDER_DAMAGE_DRAFT_CHANGED =
  "WARHAMMER_DEFENDER_DAMAGE_DRAFT_CHANGED";
export const WARHAMMER_DEFENDER_DAMAGE_DRAFT_CLEARED =
  "WARHAMMER_DEFENDER_DAMAGE_DRAFT_CLEARED";
export const WARHAMMER_DEFENDER_DAMAGE_REQUESTED =
  "WARHAMMER_DEFENDER_DAMAGE_REQUESTED";
export const WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED =
  "WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED";
export const WARHAMMER_DEFENDER_DAMAGE_FAILED =
  "WARHAMMER_DEFENDER_DAMAGE_FAILED";
export const WARHAMMER_DEFENDER_DAMAGE_BACK_TO_FORM =
  "WARHAMMER_DEFENDER_DAMAGE_BACK_TO_FORM";

export type DefenderDamageDraftField = keyof WarhammerDefenderDamageDraft;

/** Every field is a raw string except the Advanced checkbox. */
export type DefenderDamageDraftValue = string | boolean;

export function changeWarhammerDefenderDamageDraft(
  field: DefenderDamageDraftField,
  value: DefenderDamageDraftValue
) {
  return {
    type: WARHAMMER_DEFENDER_DAMAGE_DRAFT_CHANGED,
    payload: { field, value },
  };
}

export function clearWarhammerDefenderDamageDraft() {
  return { type: WARHAMMER_DEFENDER_DAMAGE_DRAFT_CLEARED };
}

export function requestWarhammerDefenderDamage(
  payload: WarhammerDefenderDamageDraft
) {
  return { type: WARHAMMER_DEFENDER_DAMAGE_REQUESTED, payload };
}

export function saveWarhammerDefenderDamageResults(
  payload: WarhammerDefenderDamageResult
) {
  return { type: WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED, payload };
}

export function failWarhammerDefenderDamage(
  errors: DefenderDamageValidationErrors
) {
  return { type: WARHAMMER_DEFENDER_DAMAGE_FAILED, payload: errors };
}

export function backToWarhammerDefenderDamageForm() {
  return { type: WARHAMMER_DEFENDER_DAMAGE_BACK_TO_FORM };
}
