import {
  CLOSE_WARHAMMER_ATTACK_RESULTS_MODAL,
  WARHAMMER_ATTACK_FAILED,
  WARHAMMER_ATTACK_REQUESTED,
  WARHAMMER_ATTACK_RESULTS_SAVED,
} from "../actions/warhammerAttackCalculator.actions";
import { WarhammerAttackResult } from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

export interface WarhammerAttackCalculatorState {
  draft: import("../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes").WarhammerAttackInput | null;
  results: WarhammerAttackResult | null;
  isResultsModalOpen: boolean;
  error: string;
}

const initialState: WarhammerAttackCalculatorState = {
  draft: null,
  results: null,
  isResultsModalOpen: false,
  error: "",
};

export default function warhammerAttackCalculatorReducer(
  state: WarhammerAttackCalculatorState = initialState,
  action: any
): WarhammerAttackCalculatorState {
  switch (action.type) {
    case WARHAMMER_ATTACK_REQUESTED:
      return { ...state, draft: action.payload, error: "" };
    case WARHAMMER_ATTACK_RESULTS_SAVED:
      return {
        ...state,
        results: action.payload,
        isResultsModalOpen: true,
        error: "",
      };
    case WARHAMMER_ATTACK_FAILED:
      return { ...state, error: action.payload };
    case CLOSE_WARHAMMER_ATTACK_RESULTS_MODAL:
      return { ...state, isResultsModalOpen: false };
    default:
      return state;
  }
}
