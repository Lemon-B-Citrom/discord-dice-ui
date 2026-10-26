import getResultsArray from "./getResultsArray";
import getWarhammerSuccessLevels from "./getWarhammerSuccessLevels";
import sl from "../components/WarhammerModal/sl";
import {
  WarhammerAttackAttempt,
  WarhammerAttackDie,
  WarhammerAttackHit,
  WarhammerAttackInput,
  WarhammerAttackResult,
} from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

export interface WarhammerAttackDiceSource {
  rollD10: () => number;
  rollD100: () => number;
}

const MAX_ROLLS_PER_ATTACK = 10000;

const randomDiceSource: WarhammerAttackDiceSource = {
  rollD10: () => getResultsArray(10)[0],
  rollD100: () => getResultsArray(100)[0],
};

export class WarhammerAttackCalculationLimitError extends Error {
  constructor() {
    super("Righteous Fury exceeded the roll limit. Please check RF On and confirmation target.");
    this.name = "WarhammerAttackCalculationLimitError";
  }
}

export default function calculateWarhammerAttack(
  input: WarhammerAttackInput,
  slType: string,
  diceSource: WarhammerAttackDiceSource = randomDiceSource
): WarhammerAttackResult {
  let rollCount = 0;
  const rollWithLimit = (roll: () => number) => {
    if (rollCount >= MAX_ROLLS_PER_ATTACK) {
      throw new WarhammerAttackCalculationLimitError();
    }
    rollCount += 1;
    return roll();
  };

  const useDarkHeresySL = slType === sl.dh;
  const useOnlyWarSL = slType === sl.ow;
  const useWarhammer2eSL = slType === sl.wfrp2e;
  const useFastSL = slType === sl.fast;

  const confirmsRighteousFury = () => {
    const result = rollWithLimit(diceSource.rollD100);
    return getWarhammerSuccessLevels({
      skillLevel: input.rfConfirmsOn,
      result,
      useFastSL,
      useDarkHeresySL,
      useOnlyWarSL,
      useWarhammer2eSL,
    }).isSuccess;
  };

  const calculateAttempt = () => {
    const baseRolls: WarhammerAttackDie[] = [];
    const righteousFuryRolls: number[] = [];
    let damage = input.damageModifier;

    for (let i = 0; i < input.damageDice; i += 1) {
      const rawRoll = rollWithLimit(diceSource.rollD10);
      const effectiveDamage = Math.max(rawRoll, input.proven);
      baseRolls.push({ roll: rawRoll, damage: effectiveDamage });
      damage += effectiveDamage;
    }

    // Proven only changes base damage dice. RF is checked against raw rolls.
    let shouldContinueRighteousFury = baseRolls.some(
      ({ roll }) => roll >= input.rfOn
    );

    while (shouldContinueRighteousFury && confirmsRighteousFury()) {
      const bonusRoll = rollWithLimit(diceSource.rollD10);
      righteousFuryRolls.push(bonusRoll);
      damage += bonusRoll;
      shouldContinueRighteousFury = bonusRoll >= input.rfOn;
    }

    return {
      baseRolls,
      righteousFuryRolls,
      damage,
    };
  };

  const attemptsPerHit =
    input.tearing === "tripleTearing" ? 3 : input.tearing === "tearing" ? 2 : 1;
  const damages: number[] = [];
  const hitDetails: WarhammerAttackHit[] = [];

  for (let hit = 0; hit < input.hits; hit += 1) {
    const attempts: WarhammerAttackAttempt[] = [];
    for (let attempt = 0; attempt < attemptsPerHit; attempt += 1) {
      attempts.push(calculateAttempt());
    }
    const selectedAttemptIndex = attempts.reduce(
      (bestIndex, attempt, index) =>
        attempt.damage > attempts[bestIndex].damage ? index : bestIndex,
      0
    );
    damages.push(attempts[selectedAttemptIndex].damage);
    hitDetails.push({ attempts, selectedAttemptIndex });
  }

  return {
    input,
    damages,
    hitDetails,
  };
}
