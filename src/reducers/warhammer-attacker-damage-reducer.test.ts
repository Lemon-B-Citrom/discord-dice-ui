import { combineReducers } from "redux";
import modalsState from "./modals-reducer";
import warhammerState from "./warhammer-reducer";
import warhammerAttackerDamage from "./warhammer-attacker-damage-reducer";
import { warhammerDiceRolled } from "../actions/warhammer.actions";
import {
  requestWarhammerAttackerDamage,
  saveWarhammerAttackerDamageResults,
} from "../actions/warhammerAttackerDamage.actions";
import { WarhammerAttackerDamageInput } from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

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

test("stores attack results separately from ordinary Warhammer roll state", () => {
  let state = reducer(undefined, { type: "@@INIT" });
  state = reducer(state, warhammerDiceRolled({ existingRoll: true }));
  const regularRollState = state.warhammerState;

  state = reducer(state, requestWarhammerAttackerDamage(attack));
  state = reducer(
    state,
    saveWarhammerAttackerDamageResults({
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
  expect(state.warhammerAttackerDamage.draft).toEqual(attack);
  expect(state.warhammerAttackerDamage.results?.damages).toEqual([8]);
  expect(state.warhammerAttackerDamage.isResultsModalOpen).toBe(true);
});
