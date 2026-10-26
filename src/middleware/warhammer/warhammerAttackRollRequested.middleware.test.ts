import { applyMiddleware, combineReducers, createStore } from "redux";
import { openWarhammerAttackCalculatorModal } from "../../actions/modals";
import { requestWarhammerAttack } from "../../actions/warhammerAttackCalculator.actions";
import modalsState from "../../reducers/modals-reducer";
import warhammerState from "../../reducers/warhammer-reducer";
import warhammerAttackCalculator from "../../reducers/warhammer-attack-calculator-reducer";
import { WarhammerAttackInput } from "../../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";
import {
  createWarhammerAttackRollRequestedMiddleware,
} from "./warhammerAttackRollRequested.middleware";

const reducer = combineReducers({
  modalsState,
  warhammerState,
  warhammerAttackCalculator,
});

const attack: WarhammerAttackInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
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
    applyMiddleware(createWarhammerAttackRollRequestedMiddleware(calculate))
  );

  store.dispatch(openWarhammerAttackCalculatorModal());
  const originalWarhammerState = store.getState().warhammerState;
  store.dispatch(requestWarhammerAttack(attack));

  expect(calculate).toHaveBeenCalledWith(attack, "warhammer4eSL");
  expect(store.getState().modalsState.isWarhammerAttackCalculatorModalOpen).toBe(
    false
  );
  expect(
    store.getState().warhammerAttackCalculator.isResultsModalOpen
  ).toBe(true);
  expect(store.getState().warhammerAttackCalculator.results?.damages).toEqual([
    12,
  ]);
  expect(store.getState().warhammerState).toBe(originalWarhammerState);
});

test("keeps the form open and exposes a calculation error", () => {
  const store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerAttackRollRequestedMiddleware(() => {
        throw new Error("Test calculation failure");
      })
    )
  );
  store.dispatch(openWarhammerAttackCalculatorModal());
  store.dispatch(requestWarhammerAttack(attack));

  expect(store.getState().modalsState.isWarhammerAttackCalculatorModalOpen).toBe(
    true
  );
  expect(store.getState().warhammerAttackCalculator.error).toBe(
    "Test calculation failure"
  );
  expect(
    store.getState().warhammerAttackCalculator.isResultsModalOpen
  ).toBe(false);
});
