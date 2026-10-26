jest.mock("../store", () => ({ __esModule: true, default: {} }));

import { applyMiddleware, combineReducers, createStore } from "redux";
import { submitRoll } from "../actions/roll.actions";
import { closeWarhammerDamageCalculatorModal } from "../actions/modals";
import { WARHAMMER_DAMAGE_CALCULATOR } from "../consts/diceConstants";
import { warhammerSet } from "../consts/diceSets";
import handleRollMiddleware from "./handleRoll.middleware";
import modalsReducer from "../reducers/modals-reducer";

const testReducer = combineReducers({ modalsState: modalsReducer });

test("Warhammer options include Damage Calculator and launch its modal", () => {
  expect(warhammerSet).toContainEqual(
    expect.objectContaining({
      diceType: WARHAMMER_DAMAGE_CALCULATOR,
      label: "Damage Calculator",
      noDropdown: true,
    })
  );

  const store = createStore(
    testReducer,
    applyMiddleware(handleRollMiddleware)
  );
  store.dispatch(
    submitRoll({ diceType: WARHAMMER_DAMAGE_CALCULATOR, diceAmount: 1 })
  );

  expect(
    store.getState().modalsState.isWarhammerDamageCalculatorModalOpen
  ).toBe(true);

  store.dispatch(closeWarhammerDamageCalculatorModal());
  expect(
    store.getState().modalsState.isWarhammerDamageCalculatorModalOpen
  ).toBe(false);
});
