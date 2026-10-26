import calculateWarhammerAttack, {
  WarhammerAttackDiceSource,
} from "./calculateWarhammerAttack";
import { WarhammerAttackInput } from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";
import sl from "../components/WarhammerModal/sl";

const attack: WarhammerAttackInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 3,
  felling: 2,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 50,
  tearing: "none",
};

function diceSource(d10: number[], d100: number[]): WarhammerAttackDiceSource {
  let d10Index = 0;
  let d100Index = 0;
  return {
    rollD10: () => d10[d10Index++],
    rollD100: () => d100[d100Index++],
  };
}

test("continues the single Fury chain until a confirmation fails", () => {
  const result = calculateWarhammerAttack(
    attack,
    sl.wfrp4e,
    diceSource([10, 10], [50, 51])
  );

  expect(result.damages).toEqual([20]);
  expect(result.hitDetails[0].attempts[0]).toEqual({
    baseRolls: [{ roll: 10, damage: 10 }],
    righteousFuryRolls: [10],
    damage: 20,
  });
});

test("records every confirmed Fury bonus die added to an attempt", () => {
  const result = calculateWarhammerAttack(
    attack,
    sl.wfrp4e,
    diceSource([10, 10, 5], [50, 50])
  );

  expect(result.damages).toEqual([25]);
  expect(result.hitDetails[0].attempts[0].righteousFuryRolls).toEqual([10, 5]);
});

test("stops the Fury chain when a bonus die is below RF", () => {
  const result = calculateWarhammerAttack(
    attack,
    sl.wfrp4e,
    diceSource([10, 5], [50])
  );

  expect(result.damages).toEqual([15]);
});

test("starts only one Fury chain when several base dice meet RF", () => {
  const result = calculateWarhammerAttack(
    { ...attack, damageDice: 3 },
    sl.wfrp4e,
    diceSource([10, 10, 10, 5], [50])
  );

  expect(result.damages).toEqual([35]);
  expect(result.hitDetails[0].attempts[0].righteousFuryRolls).toEqual([5]);
});

test("applies Proven to base dice only, not Fury bonus dice", () => {
  const result = calculateWarhammerAttack(
    { ...attack, proven: 7 },
    sl.wfrp4e,
    diceSource([10, 3], [50])
  );

  expect(result.damages).toEqual([13]);
  expect(result.hitDetails[0].attempts[0]).toEqual({
    baseRolls: [{ roll: 10, damage: 10 }],
    righteousFuryRolls: [3],
    damage: 13,
  });
});

test("records Proven-adjusted base dice and leaves Fury dice unmodified", () => {
  const result = calculateWarhammerAttack(
    { ...attack, damageDice: 2, proven: 7 },
    sl.wfrp4e,
    diceSource([3, 10, 3], [50])
  );

  expect(result.damages).toEqual([20]);
  expect(result.hitDetails[0].attempts[0]).toEqual({
    baseRolls: [
      { roll: 3, damage: 7 },
      { roll: 10, damage: 10 },
    ],
    righteousFuryRolls: [3],
    damage: 20,
  });
});

test("does not let Proven turn a non-triggering base roll into Fury", () => {
  let confirmationRolls = 0;
  const result = calculateWarhammerAttack(
    { ...attack, proven: 10 },
    sl.wfrp4e,
    {
      rollD10: () => 5,
      rollD100: () => {
        confirmationRolls += 1;
        return 1;
      },
    }
  );

  expect(result.damages).toEqual([10]);
  expect(confirmationRolls).toBe(0);
});

test("stops immediately when the initial RF confirmation fails", () => {
  const result = calculateWarhammerAttack(
    attack,
    sl.wfrp4e,
    diceSource([10], [51])
  );

  expect(result.damages).toEqual([10]);
});

test("takes the highest complete tearing attempt and handles hits separately", () => {
  const result = calculateWarhammerAttack(
    { ...attack, hits: 2, damageDice: 1, damageModifier: 2, tearing: "tearing" },
    sl.wfrp4e,
    diceSource([2, 9, 4, 6], [])
  );

  expect(result.damages).toEqual([11, 8]);
  expect(result.hitDetails.map((hit) => hit.selectedAttemptIndex)).toEqual([
    1,
    1,
  ]);
  expect(result.hitDetails[0].attempts.map((attempt) => attempt.damage)).toEqual([
    4,
    11,
  ]);
});

test("keeps the first attempt selected when tearing totals tie", () => {
  const result = calculateWarhammerAttack(
    { ...attack, tearing: "tearing" },
    sl.wfrp4e,
    diceSource([6, 6], [])
  );

  expect(result.damages).toEqual([6]);
  expect(result.hitDetails[0].selectedAttemptIndex).toBe(0);
});

test("records and selects the best of all three triple-tearing attempts", () => {
  const result = calculateWarhammerAttack(
    { ...attack, damageModifier: 2, tearing: "tripleTearing" },
    sl.wfrp4e,
    diceSource([2, 9, 4], [])
  );

  expect(result.damages).toEqual([11]);
  expect(result.hitDetails[0].attempts.map((attempt) => attempt.damage)).toEqual([
    4,
    11,
    6,
  ]);
  expect(result.hitDetails[0].selectedAttemptIndex).toBe(1);
});

test("uses the selected DoS mode for RF confirmations", () => {
  const attackWithLowTarget = { ...attack, rfConfirmsOn: 10 };
  const result = calculateWarhammerAttack(
    attackWithLowTarget,
    sl.wfrp2e,
    diceSource([10], [11])
  );

  expect(result.damages).toEqual([10]);
});

test("enforces a roll budget for large multi-hit attacks", () => {
  expect(() =>
    calculateWarhammerAttack(
      {
        ...attack,
        hits: 100,
        damageDice: 100,
        rfOn: 10,
        tearing: "tripleTearing",
      },
      sl.wfrp4e,
      { rollD10: () => 1, rollD100: () => 100 }
    )
  ).toThrow("exceeded the roll limit");
});
