import {
  CLOSE_WARHAMMER_ATTACKER_DAMAGE_RESULTS_MODAL,
  WARHAMMER_ATTACKER_DAMAGE_FAILED,
  WARHAMMER_ATTACKER_DAMAGE_REQUESTED,
  WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED,
} from "../actions/warhammerAttackerDamage.actions";
import { WarhammerAttackerDamageResult } from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

export interface WarhammerAttackerDamageState {
  draft: import("../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes").WarhammerAttackerDamageInput | null;
  results: WarhammerAttackerDamageResult | null;
  isResultsModalOpen: boolean;
  error: string;
}

const initialState: WarhammerAttackerDamageState = {
  draft: null,
  results: null,
  isResultsModalOpen: false,
  error: "",
};

export default function warhammerAttackerDamageReducer(
  state: WarhammerAttackerDamageState = initialState,
  action: any
): WarhammerAttackerDamageState {
  switch (action.type) {
    case WARHAMMER_ATTACKER_DAMAGE_REQUESTED:
      return { ...state, draft: action.payload, error: "" };
    case WARHAMMER_ATTACKER_DAMAGE_RESULTS_SAVED:
      return {
        ...state,
        results: action.payload,
        isResultsModalOpen: true,
        error: "",
      };
    case WARHAMMER_ATTACKER_DAMAGE_FAILED:
      return { ...state, error: action.payload };
    case CLOSE_WARHAMMER_ATTACKER_DAMAGE_RESULTS_MODAL:
      return { ...state, isResultsModalOpen: false };
    default:
      return state;
  }
}
