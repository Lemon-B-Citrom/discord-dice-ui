jest.mock("../../src/store", () => ({ __esModule: true, default: {} }));

import { applyMiddleware, combineReducers, createStore } from "redux";
import { submitRoll } from "../../src/actions/roll.actions";
import {
  closeWarhammerAttackerDamageModal,
  closeWarhammerDefenderDamageModal,
} from "../../src/actions/modals";
import {
  WARHAMMER_ATTACKER_DAMAGE,
  WARHAMMER_DEFENDER_DAMAGE,
} from "../../src/consts/diceConstants";
import { warhammerSet } from "../../src/consts/diceSets";
import handleRollMiddleware from "../../src/middleware/handleRoll.middleware";
import modalsReducer from "../../src/reducers/modals-reducer";

const testReducer = combineReducers({ modalsState: modalsReducer });

test("Warhammer options include Defender Damage and launch its modal", () => {
  expect(warhammerSet).toContainEqual(
    expect.objectContaining({
      diceType: WARHAMMER_DEFENDER_DAMAGE,
      label: "Defender Damage",
      noDropdown: true,
    })
  );

  const store = createStore(testReducer, applyMiddleware(handleRollMiddleware));
  store.dispatch(
    submitRoll({ diceType: WARHAMMER_DEFENDER_DAMAGE, diceAmount: 1 })
  );

  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(
    true
  );

  store.dispatch(closeWarhammerDefenderDamageModal());
  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(
    false
  );
});

test("Warhammer options include Attacker Damage and launch its modal", () => {
  expect(warhammerSet).toContainEqual(
    expect.objectContaining({
      diceType: WARHAMMER_ATTACKER_DAMAGE,
      label: "Attacker Damage",
      noDropdown: true,
    })
  );

  const store = createStore(testReducer, applyMiddleware(handleRollMiddleware));
  store.dispatch(
    submitRoll({ diceType: WARHAMMER_ATTACKER_DAMAGE, diceAmount: 1 })
  );

  expect(store.getState().modalsState.isWarhammerAttackerDamageModalOpen).toBe(
    true
  );

  store.dispatch(closeWarhammerAttackerDamageModal());
  expect(store.getState().modalsState.isWarhammerAttackerDamageModalOpen).toBe(
    false
  );
});
