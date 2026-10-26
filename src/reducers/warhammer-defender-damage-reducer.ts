import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageResult,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  WARHAMMER_DEFENDER_DAMAGE_DRAFT_CHANGED,
  WARHAMMER_DEFENDER_DAMAGE_DRAFT_CLEARED,
  WARHAMMER_DEFENDER_DAMAGE_FAILED,
  WARHAMMER_DEFENDER_DAMAGE_REQUESTED,
  WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED,
} from "../actions/warhammerDefenderDamage.actions";

export interface WarhammerDefenderDamageState {
  draft: WarhammerDefenderDamageDraft;
  results: WarhammerDefenderDamageResult | null;
  errors: DefenderDamageValidationErrors;
  clearCounter: number;
}

const initialState: WarhammerDefenderDamageState = {
  draft: { ...EMPTY_DEFENDER_DAMAGE_DRAFT },
  results: null,
  errors: {},
  clearCounter: 0,
};

export default function warhammerDefenderDamageReducer(
  state: WarhammerDefenderDamageState = initialState,
  action: any
): WarhammerDefenderDamageState {
  switch (action.type) {
    case WARHAMMER_DEFENDER_DAMAGE_DRAFT_CHANGED:
      return {
        ...state,
        draft: { ...state.draft, [action.payload.field]: action.payload.value },
        errors: {},
      };
    case WARHAMMER_DEFENDER_DAMAGE_DRAFT_CLEARED:
      return {
        ...state,
        draft: { ...EMPTY_DEFENDER_DAMAGE_DRAFT },
        errors: {},
        clearCounter: state.clearCounter + 1,
      };
    case WARHAMMER_DEFENDER_DAMAGE_REQUESTED:
      return { ...state, draft: { ...action.payload }, errors: {} };
    case WARHAMMER_DEFENDER_DAMAGE_RESULTS_SAVED:
      return { ...state, results: action.payload, errors: {} };
    case WARHAMMER_DEFENDER_DAMAGE_FAILED:
      return { ...state, errors: action.payload };
    default:
      return state;
  }
}
