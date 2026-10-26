import { combineReducers } from "redux";
import modalsState from "./modals-reducer";
import warhammerState from "./warhammer-reducer";
import warhammerAttackCalculator from "./warhammer-attack-calculator-reducer";
import { warhammerDiceRolled } from "../actions/warhammer.actions";
import {
  requestWarhammerAttack,
  saveWarhammerAttackResults,
} from "../actions/warhammerAttackCalculator.actions";
import { WarhammerAttackInput } from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

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

test("stores attack results separately from ordinary Warhammer roll state", () => {
  let state = reducer(undefined, { type: "@@INIT" });
  state = reducer(state, warhammerDiceRolled({ existingRoll: true }));
  const regularRollState = state.warhammerState;

  state = reducer(state, requestWarhammerAttack(attack));
  state = reducer(
    state,
    saveWarhammerAttackResults({
      input: attack,
      damages: [8],
      hitDetails: [
        {
          attempts: [
            {
              baseRolls: [{ roll: 8, damage: 8 }],
              righteousFuryRolls: [],
              damage: 8,
            },
          ],
          selectedAttemptIndex: 0,
        },
      ],
    })
  );

  expect(state.warhammerState).toBe(regularRollState);
  expect(state.warhammerAttackCalculator.draft).toEqual(attack);
  expect(state.warhammerAttackCalculator.results?.damages).toEqual([8]);
  expect(state.warhammerAttackCalculator.isResultsModalOpen).toBe(true);
});
