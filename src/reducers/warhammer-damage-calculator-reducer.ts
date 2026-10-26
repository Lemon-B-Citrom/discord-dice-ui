import {
  EMPTY_DAMAGE_DRAFT,
  DamageValidationErrors,
  WarhammerDamageDraft,
  WarhammerDamageResult,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import {
  WARHAMMER_DAMAGE_DRAFT_CHANGED,
  WARHAMMER_DAMAGE_DRAFT_CLEARED,
  WARHAMMER_DAMAGE_FAILED,
  WARHAMMER_DAMAGE_REQUESTED,
  WARHAMMER_DAMAGE_RESULTS_SAVED,
} from "../actions/warhammerDamageCalculator.actions";

export interface WarhammerDamageCalculatorState {
  draft: WarhammerDamageDraft;
  results: WarhammerDamageResult | null;
  errors: DamageValidationErrors;
  clearCounter: number;
}

const initialState: WarhammerDamageCalculatorState = {
  draft: { ...EMPTY_DAMAGE_DRAFT },
  results: null,
  errors: {},
  clearCounter: 0,
};

export default function warhammerDamageCalculatorReducer(
  state: WarhammerDamageCalculatorState = initialState,
  action: any
): WarhammerDamageCalculatorState {
  switch (action.type) {
    case WARHAMMER_DAMAGE_DRAFT_CHANGED:
      return {
        ...state,
        draft: { ...state.draft, [action.payload.field]: action.payload.value },
        errors: {},
      };
    case WARHAMMER_DAMAGE_DRAFT_CLEARED:
      return {
        ...state,
        draft: { ...EMPTY_DAMAGE_DRAFT },
        errors: {},
        clearCounter: state.clearCounter + 1,
      };
    case WARHAMMER_DAMAGE_REQUESTED:
      return { ...state, draft: { ...action.payload }, errors: {} };
    case WARHAMMER_DAMAGE_RESULTS_SAVED:
      return { ...state, results: action.payload, errors: {} };
    case WARHAMMER_DAMAGE_FAILED:
      return { ...state, errors: action.payload };
    default:
      return state;
  }
}
