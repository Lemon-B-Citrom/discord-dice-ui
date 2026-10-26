import {
  WarhammerAttackerDamageInput,
  WarhammerAttackerDamageResult,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

export const WARHAMMER_ATTACKER_DAMAGE_REQUESTED = "WARHAMMER_ATTACKER_DAMAGE_REQUESTED";
export const WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED = "WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED";
export const WARHAMMER_ATTACKER_DAMAGE_FAILED = "WARHAMMER_ATTACKER_DAMAGE_FAILED";
export const CLOSE_WARHAMMER_ATTACKER_DAMAGE_RESULTS_MODAL =
  "CLOSE_WARHAMMER_ATTACKER_DAMAGE_RESULTS_MODAL";

export function requestWarhammerAttackerDamage(payload: WarhammerAttackerDamageInput) {
  return { type: WARHAMMER_ATTACKER_DAMAGE_REQUESTED, payload };
}

export function saveWarhammerAttackerDamageResults(payload: WarhammerAttackerDamageResult) {
  return { type: WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED, payload };
}

export function failWarhammerAttackerDamage(payload: string) {
  return { type: WARHAMMER_ATTACKER_DAMAGE_FAILED, payload };
}

export function closeWarhammerAttackerDamageResultsModal() {
  return { type: CLOSE_WARHAMMER_ATTACKER_DAMAGE_RESULTS_MODAL };
}
