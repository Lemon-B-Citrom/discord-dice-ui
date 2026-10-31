import { combineReducers } from "redux";
import modalsState from "../../src/reducers/modals-reducer";
import warhammerState from "../../src/reducers/warhammer-reducer";
import warhammerAttackerDamage from "../../src/reducers/warhammer-attacker-damage-reducer";
import { warhammerDiceRolled } from "../../src/actions/warhammer.actions";
import {
  requestWarhammerAttackerDamage,
  saveWarhammerAttackerDamageResults,
} from "../../src/actions/warhammerAttackerDamage.actions";
import { WarhammerAttackerDamageInput } from "../../src/components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

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
  firstHitLocation: "Body",
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
