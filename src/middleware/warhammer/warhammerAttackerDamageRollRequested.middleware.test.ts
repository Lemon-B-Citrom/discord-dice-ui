import { applyMiddleware, combineReducers, createStore } from "redux";
import { openWarhammerAttackerDamageModal } from "../../actions/modals";
import { requestWarhammerAttackerDamage } from "../../actions/warhammerAttackerDamage.actions";
import modalsState from "../../reducers/modals-reducer";
import warhammerState from "../../reducers/warhammer-reducer";
import warhammerAttackerDamage from "../../reducers/warhammer-attacker-damage-reducer";
import { WarhammerAttackerDamageInput } from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import {
  createWarhammerAttackerDamageRollRequestedMiddleware,
} from "./warhammerAttackerDamageRollRequested.middleware";

const reducer = combineReducers({
  modalsState,
  warhammerState,
  warhammerAttackerDamage,
});

const attack: WarhammerAttackerDamageInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  alwaysConfirm: false,
  tearing: "none",
};

test("calculates with the selected DoS system and opens isolated results", () => {
  const calculate = jest.fn(() => ({
    input: attack,
    damages: [12],
    hitDetails: [
      {
        attempts: [
          {
            baseRolls: [{ roll: 10, damage: 10 }],
            righteousFuryRolls: [2],
            damage: 12,
          },
        ],
        selectedAttemptIndex: 0,
      },
    ],
  }));
  const store = createStore(
    reducer,
    applyMiddleware(createWarhammerAttackerDamageRollRequestedMiddleware(calculate))
  );

  store.dispatch(openWarhammerAttackerDamageModal());
  const originalWarhammerState = store.getState().warhammerState;
  store.dispatch(requestWarhammerAttackerDamage(attack));

  expect(calculate).toHaveBeenCalledWith(attack, "warhammer4eSL");
  expect(store.getState().modalsState.isWarhammerAttackerDamageModalOpen).toBe(
    false
  );
  expect(
    store.getState().warhammerAttackerDamage.isResultsModalOpen
  ).toBe(true);
  expect(store.getState().warhammerAttackerDamage.results?.damages).toEqual([
    12,
  ]);
  expect(store.getState().warhammerState).toBe(originalWarhammerState);
});

test("keeps the form open and exposes a calculation error", () => {
  const store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerAttackerDamageRollRequestedMiddleware(() => {
        throw new Error("Test calculation failure");
      })
    )
  );
  store.dispatch(openWarhammerAttackerDamageModal());
  store.dispatch(requestWarhammerAttackerDamage(attack));

  expect(store.getState().modalsState.isWarhammerAttackerDamageModalOpen).toBe(
    true
  );
  expect(store.getState().warhammerAttackerDamage.error).toBe(
    "Test calculation failure"
  );
  expect(
    store.getState().warhammerAttackerDamage.isResultsModalOpen
  ).toBe(false);
});
