import { WarhammerAttackerDamageResult } from "../../src/components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import projectWarhammerAttackerDamageSummary from "../../src/utils/projectWarhammerAttackerDamageSummary";

const result = (): WarhammerAttackerDamageResult => ({
  input: {
    hits: 1,
    damageDice: 1,
    damageModifier: 0,
    penetration: 3,
    felling: 0,
    devastating: 0,
    proven: 0,
    rfOn: 10,
    rfConfirmsOn: 0,
    alwaysConfirm: false,
    tearing: "none",
    firstHitLocation: "Left Arm",
  },
  damages: [15],
  hitDetails: [
    {
      attempts: [
        {
          baseRolls: [{ roll: 10, damage: 10 }],
          righteousFuryRolls: [5],
          damage: 15,
        },
      ],
      selectedAttemptIndex: 0,
    },
  ],
});

test("projects a completed Fury hit into the shared damage summary", () => {
  expect(projectWarhammerAttackerDamageSummary(result())).toEqual({
    penetration: 3,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Left Arm",
    damages: [15],
    baseDamages: [10],
  });
});

test("rejects incomplete attack snapshots at the projection boundary", () => {
  const incomplete = result();
  incomplete.damages = [];
  expect(() => projectWarhammerAttackerDamageSummary(incomplete)).toThrow(
    "Invalid Warhammer attack result"
  );

  const invalidSelection = result();
  invalidSelection.hitDetails[0].selectedAttemptIndex = 1;
  expect(() => projectWarhammerAttackerDamageSummary(invalidSelection)).toThrow(
    "Invalid Warhammer attack result"
  );
});
