import {
  WarhammerAttackInput,
  WarhammerAttackResult,
} from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

export const WARHAMMER_ATTACK_REQUESTED = "WARHAMMER_ATTACK_REQUESTED";
export const WARHAMMER_ATTACK_RESULTS_SAVED = "WARHAMMER_ATTACK_RESULTS_SAVED";
export const WARHAMMER_ATTACK_FAILED = "WARHAMMER_ATTACK_FAILED";
export const CLOSE_WARHAMMER_ATTACK_RESULTS_MODAL =
  "CLOSE_WARHAMMER_ATTACK_RESULTS_MODAL";

export function requestWarhammerAttack(payload: WarhammerAttackInput) {
  return { type: WARHAMMER_ATTACK_REQUESTED, payload };
}

export function saveWarhammerAttackResults(payload: WarhammerAttackResult) {
  return { type: WARHAMMER_ATTACK_RESULTS_SAVED, payload };
}

export function failWarhammerAttack(payload: string) {
  return { type: WARHAMMER_ATTACK_FAILED, payload };
}

export function closeWarhammerAttackResultsModal() {
  return { type: CLOSE_WARHAMMER_ATTACK_RESULTS_MODAL };
}
