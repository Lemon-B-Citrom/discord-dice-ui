import { applyMiddleware, combineReducers, createStore } from "redux";
import { requestWarhammerDamage } from "../../actions/warhammerDamageCalculator.actions";
import modalsState from "../../reducers/modals-reducer";
import warhammerDamageCalculator from "../../reducers/warhammer-damage-calculator-reducer";
import { WarhammerDamageDraft } from "../../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import { createWarhammerDamageCalculationRequestedMiddleware } from "./warhammerDamageCalculationRequested.middleware";

const counter = (state = 0, action: any) =>
  action.type === "UNRELATED" ? state + 1 : state;

const reducer = combineReducers({
  modalsState,
  warhammerDamageCalculator,
  counter,
});

const draft: WarhammerDamageDraft = {
  attackSummaryString: "Pen 0, Fel 0: 12, 8",
  toughnessBonus: "2",
  fortitude: "",
  armorHead: "",
  armorBody: "",
  armorArms: "",
  armorLegs: "",
  firstHitLocation: "Head",
  trueHits: "",
  magPer: "",
  devastating: "",
  woundsPer: "",
};

test("converts a calculator throw into a form error and keeps the draft", () => {
  const calculate = jest.fn(() => {
    throw new Error("Test calculation failure");
  });
  const store = createStore(
    reducer,
    applyMiddleware(createWarhammerDamageCalculationRequestedMiddleware(calculate))
  );

  store.dispatch(requestWarhammerDamage(draft));

  expect(calculate).toHaveBeenCalledTimes(1);
  expect(store.getState().warhammerDamageCalculator.draft).toEqual(draft);
  expect(store.getState().warhammerDamageCalculator.errors).toEqual({
    form: "Test calculation failure",
  });
  expect(store.getState().warhammerDamageCalculator.results).toBeNull();
  expect(store.getState().modalsState.isWarhammerDamageResultsModalOpen).toBe(
    false
  );
});

test("rejects an invalid direct request before calling the calculator", () => {
  const calculate = jest.fn();
  const store = createStore(
    reducer,
    applyMiddleware(createWarhammerDamageCalculationRequestedMiddleware(calculate))
  );

  store.dispatch(
    requestWarhammerDamage({ ...draft, attackSummaryString: "not a summary" })
  );

  expect(calculate).not.toHaveBeenCalled();
  expect(
    store.getState().warhammerDamageCalculator.errors.attackSummaryString
  ).toBeTruthy();
  expect(store.getState().warhammerDamageCalculator.results).toBeNull();
});

test("forwards unrelated actions exactly once", () => {
  const store = createStore(
    reducer,
    applyMiddleware(createWarhammerDamageCalculationRequestedMiddleware())
  );

  store.dispatch({ type: "UNRELATED" });

  expect(store.getState().counter).toBe(1);
});
