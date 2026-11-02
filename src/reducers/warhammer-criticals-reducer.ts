import {
  CriticalValidationErrors,
  ResolvedWarhammerCriticalResult,
} from "../utils/WarhammerCustom/criticals/criticalTypes";
import {
  WARHAMMER_CRITICAL_DAMAGE_CHANGED,
  WARHAMMER_CRITICAL_FAILED,
  WARHAMMER_CRITICAL_LOCATION_SELECTED,
  WARHAMMER_CRITICAL_RESULTS_SAVED,
  WARHAMMER_CRITICAL_SEND_WARNED,
  WarhammerCriticalSelection,
} from "../actions/warhammerCriticals.actions";
import { OPEN_WARHAMMER_CRITICALS_MODAL } from "../actions/modals";

export interface WarhammerCriticalsState {
  readonly damage: string;
  readonly selectedLocation: WarhammerCriticalSelection | null;
  readonly results: ResolvedWarhammerCriticalResult | null;
  readonly errors: CriticalValidationErrors;
  readonly sendWarning: string;
}

const initialState: WarhammerCriticalsState = {
  damage: "",
  selectedLocation: null,
  results: null,
  errors: {},
  sendWarning: "",
};

export default function warhammerCriticalsReducer(
  state: WarhammerCriticalsState = initialState,
  action: any
): WarhammerCriticalsState {
  switch (action.type) {
    case OPEN_WARHAMMER_CRITICALS_MODAL:
      return { ...state, selectedLocation: null, errors: {}, sendWarning: "" };
    case WARHAMMER_CRITICAL_DAMAGE_CHANGED:
      return {
        ...state,
        damage: action.payload,
        selectedLocation: null,
        errors: {},
      };
    case WARHAMMER_CRITICAL_LOCATION_SELECTED:
      return {
        ...state,
        selectedLocation: action.payload,
        errors: {},
      };
    case WARHAMMER_CRITICAL_RESULTS_SAVED:
      return {
        ...state,
        selectedLocation:
          action.payload.request.family === "humanoid"
            ? {
                family: action.payload.request.family,
                location: action.payload.request.location,
              }
            : null,
        results: action.payload,
        errors: {},
        sendWarning: "",
      };
    case WARHAMMER_CRITICAL_FAILED:
      return { ...state, errors: action.payload };
    case WARHAMMER_CRITICAL_SEND_WARNED:
      return { ...state, sendWarning: action.payload };
    default:
      return state;
  }
}
