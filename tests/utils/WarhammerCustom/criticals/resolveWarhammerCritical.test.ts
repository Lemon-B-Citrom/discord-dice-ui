import { lookupWarhammerCritical } from "../../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";
import {
  HUMANOID_CRITICAL_TABLES,
  VEHICLE_CRITICAL_TABLES,
} from "../../../../src/utils/WarhammerCustom/criticals/criticalTables";
import { resolveWarhammerCriticalResult } from "../../../../src/utils/WarhammerCustom/criticals/resolveWarhammerCritical";

test("rolls status durations once and retains source prose", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "head",
    damageType: "Energy",
    severity: 3,
  });
  const rollDie = jest.fn(() => 3);
  const resolved = resolveWarhammerCriticalResult(source, rollDie);

  expect(rollDie).toHaveBeenCalledTimes(1);
  expect(rollDie).toHaveBeenCalledWith(5);
  expect(resolved.resolvedSections[0].statusRolls).toEqual([
    expect.objectContaining({
      expression: "1d5",
      dice: [3],
      result: 3,
      effect: "Deafened",
      unit: "hours",
      entryNumber: 1,
    }),
  ]);
  expect(resolved.effect.text).toBe(source.effect.text);
});

test("rolls every die in a multi-die status expression", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "body",
    damageType: "Energy",
    severity: 7,
  });
  const rollDie = jest.fn((sides: number) => sides);
  const resolved = resolveWarhammerCriticalResult(source, rollDie);

  expect(rollDie.mock.calls).toEqual([[10], [10], [10]]);
  expect(resolved.effect.text).toContain("Toughness characteristic is permanently reduced by 1d10");
  expect(resolved.resolvedSections[0].statusRolls).toEqual([
    expect.objectContaining({ dice: [10, 10], result: 20, effect: "Stunned" }),
    expect.objectContaining({ dice: [10], result: 10, entryNumber: 2 }),
  ]);
  expect(
    resolved.resolvedSections[0].statusRolls[1].effect
  ).toBeUndefined();
});

test("rolls quantities without an attached status effect", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "head",
    damageType: "Energy",
    severity: 6,
  });
  const rollDie = jest.fn((sides: number) => 3);
  const resolved = resolveWarhammerCriticalResult(source, rollDie);
  const [fatigue, blinded, characteristics] = resolved.resolvedSections[0]
    .statusRolls;

  expect(rollDie.mock.calls).toEqual([[5], [10], [5]]);
  expect(fatigue).toEqual(
    expect.objectContaining({
      expression: "1d5",
      result: 3,
      effect: "Fatigue",
      unit: "levels",
      entryNumber: 1,
    })
  );
  expect(blinded).toEqual(
    expect.objectContaining({
      expression: "1d10",
      result: 3,
      effect: "Blinded",
      unit: "hours",
      entryNumber: 2,
    })
  );
  expect(characteristics).toEqual({
    start: source.effect.text.lastIndexOf("1d5"),
    end: source.effect.text.lastIndexOf("1d5") + 3,
    entryNumber: 3,
    expression: "1d5",
    dice: [3],
    result: 3,
  });
  expect(resolved.effect.text).toBe(source.effect.text);
});

test("leaves deferred roll instructions unrolled", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "head",
    damageType: "Energy",
    severity: 7,
  });
  const rollDie = jest.fn(() => 2);
  const resolved = resolveWarhammerCriticalResult(source, rollDie);

  expect(rollDie.mock.calls).toEqual([[10]]);
  expect(resolved.resolvedSections[0].statusRolls).toHaveLength(1);
  expect(resolved.effect.text).toContain("Roll 1d10; this is the target’s new Fellowship");
});

test("marks status rolls gated by a failed check and retains the manual check", () => {
  const source = lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 3,
  });
  const resolved = resolveWarhammerCriticalResult(source, () => 2);
  const section = resolved.resolvedSections[0];

  expect(section.statusRolls[0].condition).toBe(
    "Per affected character; Only if Ordinary (+10) Fortitude Test fails"
  );
  expect(section.checks.map(({ text }) => text)).toContain(
    "Ordinary (+10) Fortitude Test"
  );
  expect(
    source.effect.text.slice(section.checks[0].start, section.checks[0].end)
  ).toBe(section.checks[0].text);
  expect(section.statusRolls[0].entryNumber).toBe(1);
  expect(section.checks[0].entryNumber).toBe(2);
});

test("labels status quantities that apply only after a check succeeds", () => {
  const source = lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 1,
  });
  const customResult = {
    ...source,
    effect: {
      ...source.effect,
      text: "The target must make a Challenging (+0) Fortitude Test. If he succeeds, he suffers 1d5 levels of Fatigue.",
    },
  };
  const resolved = resolveWarhammerCriticalResult(customResult, () => 2);

  expect(resolved.resolvedSections[0].statusRolls[0].condition).toBe(
    "Only if Challenging (+0) Fortitude Test succeeds"
  );
});

test("labels status quantities that apply only if the target survives", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "arm",
    damageType: "Energy",
    severity: 9,
  });
  const resolved = resolveWarhammerCriticalResult(source, () => 4);

  expect(resolved.resolvedSections[0].statusRolls[0]).toEqual(
    expect.objectContaining({
      effect: "Fatigue",
      condition: "Only if the target survives",
    })
  );
});

test("keeps same-expression status occurrences independent and in text order", () => {
  const source = lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 1,
  });
  const customResult = {
    ...source,
    effect: {
      ...source.effect,
      text: "The target is Stunned for 1d5 rounds and is Useless for 1d5 rounds.",
    },
  };
  const outcomes = [2, 4];
  const resolved = resolveWarhammerCriticalResult(
    customResult,
    () => outcomes.shift() as number
  );

  expect(resolved.resolvedSections[0].statusRolls.map(({ result }) => result)).toEqual([
    2,
    4,
  ]);
  const text = resolved.effect.text;
  expect(
    resolved.resolvedSections[0].statusRolls.map(({ start }) => start)
  ).toEqual([text.indexOf("1d5"), text.lastIndexOf("1d5")]);
});

test("rolls distance and damage quantities that carry no status effect", () => {
  const source = lookupWarhammerCritical({
    family: "humanoid",
    location: "body",
    damageType: "Explosive",
    severity: 1,
  });
  const rollDie = jest.fn(() => 1);
  const resolved = resolveWarhammerCriticalResult(source, rollDie);

  expect(source.effect.text).toContain("1d5 metres");
  expect(rollDie.mock.calls).toEqual([[5]]);
  expect(resolved.resolvedSections[0].statusRolls).toEqual([
    expect.objectContaining({ expression: "1d5", result: 1, entryNumber: 1 }),
  ]);
  expect(resolved.resolvedSections[0].statusRolls[0].effect).toBeUndefined();
});

test("includes dice modifiers in the rolled total", () => {
  const source = lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 1,
  });
  const customResult = {
    ...source,
    effect: {
      ...source.effect,
      text: "The target suffers a single hit for 1d10+6 Impact damage.",
    },
  };
  const resolved = resolveWarhammerCriticalResult(customResult, () => 4);

  expect(resolved.resolvedSections[0].statusRolls).toEqual([
    expect.objectContaining({ expression: "1d10+6", dice: [4], result: 10 }),
  ]);
});

test("resolves every current table row without changing source text", () => {
  HUMANOID_CRITICAL_TABLES.concat(VEHICLE_CRITICAL_TABLES).forEach((table) => {
    table.rows.forEach((row) => {
      const source = lookupWarhammerCritical({
        family: table.family,
        location: table.location,
        ...(table.damageType ? { damageType: table.damageType } : {}),
        severity: row.severity,
      });
      const originalTexts = [
        ...source.prerequisites.map(({ text }) => text),
        source.effect.text,
      ];
      const resolved = resolveWarhammerCriticalResult(source, () => 1);

      expect(
        resolved.resolvedSections.map(({ effect }) => effect.text)
      ).toEqual(originalTexts);
      resolved.resolvedSections.forEach((section) => {
        section.statusRolls.forEach((roll) => {
          expect(section.effect.text.slice(roll.start, roll.end)).toBe(
            roll.expression
          );
        });
      });
    });
  });
});
