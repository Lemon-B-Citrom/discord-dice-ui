import { applyMiddleware, combineReducers, createStore } from "redux";
import { requestWarhammerDefenderDamage } from "../../actions/warhammerDefenderDamage.actions";
import modalsState from "../../reducers/modals-reducer";
import warhammerDefenderDamage from "../../reducers/warhammer-defender-damage-reducer";
import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { createWarhammerDefenderDamageCalculationRequestedMiddleware } from "./warhammerDefenderDamageCalculationRequested.middleware";

const counter = (state = 0, action: any) =>
  action.type === "UNRELATED" ? state + 1 : state;

const reducer = combineReducers({
  modalsState,
  warhammerDefenderDamage,
  counter,
});

const draft: WarhammerDefenderDamageDraft = {
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  attackSummaryString: "Pen 0, Fel 0, @body: 12 8",
  toughnessBonus: "2",
};

test("converts a calculation throw into a form error and keeps the draft", () => {
  const calculate = jest.fn(() => {
    throw new Error("Test calculation failure");
  });
  const store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerDefenderDamageCalculationRequestedMiddleware(calculate)
    )
  );

  store.dispatch(requestWarhammerDefenderDamage(draft));

  expect(calculate).toHaveBeenCalledTimes(1);
  expect(store.getState().warhammerDefenderDamage.draft).toEqual(draft);
  expect(store.getState().warhammerDefenderDamage.errors).toEqual({
    form: "Test calculation failure",
  });
  expect(store.getState().warhammerDefenderDamage.results).toBeNull();
  expect(
    store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen
  ).toBe(false);
});

test("rejects an invalid direct request before calling the calculation", () => {
  const calculate = jest.fn();
  const store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerDefenderDamageCalculationRequestedMiddleware(calculate)
    )
  );

  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "not a summary",
    })
  );

  expect(calculate).not.toHaveBeenCalled();
  expect(
    store.getState().warhammerDefenderDamage.errors.attackSummaryString
  ).toBeTruthy();
  expect(store.getState().warhammerDefenderDamage.results).toBeNull();
});

test("forwards unrelated actions exactly once", () => {
  const store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerDefenderDamageCalculationRequestedMiddleware()
    )
  );

  store.dispatch({ type: "UNRELATED" });

  expect(store.getState().counter).toBe(1);
});
