import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import calculateWarhammerDefenderDamage from "./calculateWarhammerDefenderDamage";
import normalizeWarhammerDefenderDamage from "./normalizeWarhammerDefenderDamage";

const makeResult = (patch: Partial<WarhammerDefenderDamageDraft>) => {
  // Horde mode is opt-in, so a patch that supplies Horde fields ticks the box.
  const suppliesHordeFields =
    "trueHits" in patch || "magPer" in patch || "woundsPer" in patch;
  const draft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0: 20, 10, 5, 55",
    firstHitLocation: "Body",
    ...patch,
    hordeEnabled: patch.hordeEnabled ?? suppliesHordeFields,
  };
  const normalized = normalizeWarhammerDefenderDamage(draft);
  if (!normalized.request) throw new Error(JSON.stringify(normalized.errors));
  return calculateWarhammerDefenderDamage(draft, normalized.request);
};

test("doubles Toughness before Felling for the first N single hits including zero damage", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 2: -1, 20, 20,",
    toughnessBonus: "6", fortitude: "2",
  });
  expect(result.entries.map((hit) => hit.kind === "hit" && [hit.fortitudeApplied, hit.effectiveToughnessBonus, hit.finalDamage]))
    .toEqual([[true, 10, 0], [true, 10, 10], [false, 4, 16]]);
  expect(result.totals.damage).toBe(26);
});

test("uses independent true and double-sized bonus Fortitude quotas", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 2, Dev 1: 20, 20, 20, 20, 20,",
    toughnessBonus: "6", fortitude: "1", trueHits: "2", magPer: "6", woundsPer: "20",
  });
  expect(result.entries.map((hit) => hit.kind === "hit" && hit.fortitudeApplied))
    .toEqual([true, false, true, true, false, false]);
  expect(result.entries[0]).toMatchObject({ classification: "partial-overkill", magnitude: 4 });
  expect(result.totals).toEqual({ damage: 62, magnitude: 12, killCount: 2 });
});

test.each(["0", "1", "4"])("accepts excess Fortitude with %s true hits and preserves synthetic Devastating", (trueHits) => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Dev 1: 20, 10, 5, 55",
    toughnessBonus: "6", fortitude: String(Number.MAX_SAFE_INTEGER),
    trueHits, magPer: "6", woundsPer: "20",
  });
  expect(result.entries.filter((hit) => hit.kind === "hit").every((hit) => hit.kind === "hit" && hit.fortitudeApplied)).toBe(true);
  expect(result.entries.filter((hit) => hit.kind === "bonus-devastating")).toHaveLength(trueHits === "4" ? 0 : 1);
});

test.each(["12", "13"])("clamps doubled Toughness at Felling %s", (felling) => {
  const result = makeResult({ attackSummaryString: `Pen 0, Fel ${felling}: 20`, toughnessBonus: "6", fortitude: "1" });
  expect(result.entries[0]).toMatchObject({ effectiveToughnessBonus: 0, finalDamage: 20 });
});

test("rejects unsafe doubled Toughness", () => {
  expect(() => makeResult({ toughnessBonus: String(Number.MAX_SAFE_INTEGER), fortitude: "1" })).toThrow(/safe whole-number/);
});

test("does not transfer unused true-hit protection to bonus hits", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 0: 20, 20, 20, 20, 20, 20",
    toughnessBonus: "6", fortitude: "2", trueHits: "1", magPer: "6", woundsPer: "20",
  });
  expect(result.entries.map((hit) => hit.kind === "hit" && hit.fortitudeApplied))
    .toEqual([true, true, true, true, true, false]);
});

test("accepts single-target Fortitude beyond the number of hits", () => {
  const result = makeResult({ toughnessBonus: "6", fortitude: String(Number.MAX_SAFE_INTEGER) });
  expect(result.entries.every((hit) => hit.kind === "hit" && hit.fortitudeApplied)).toBe(true);
});

test("calculates the specified Horde totals and separate synthetic contribution", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Dev 1: 20, 10, 5, 55",
    trueHits: "3",
    magPer: "6",
    woundsPer: "20",
  });
  expect(
    result.entries.map((entry) =>
      entry.kind === "hit" ? entry.finalDamage : null
    )
  ).toEqual([20, 10, 5, 55, null]);
  expect(
    result.entries.map((entry) =>
      entry.kind === "bonus-devastating" || entry.mode === "horde"
        ? entry.magnitude
        : null
    )
  ).toEqual([7, 4, 2, 1, 1]);
  expect(result.totals).toEqual({ damage: 90, magnitude: 15, killCount: 2 });
  expect(result.entries[4]).toEqual({
    kind: "bonus-devastating",
    number: 5,
    magnitude: 1,
  });
});

test("clamps received damage to zero and avoids Overkill at zero wounds", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Dev 4: 0, -1",
    trueHits: "2",
    magPer: "6",
    woundsPer: "0",
  });
  expect(
    result.entries.map((entry) =>
      entry.kind === "hit" ? entry.finalDamage : null
    )
  ).toEqual([0, 0]);
  expect(
    result.entries.map((entry) =>
      entry.kind === "hit" && entry.mode === "horde"
        ? entry.baseMagnitude
        : null
    )
  ).toEqual([0, 0]);
  expect(result.totals).toEqual({ damage: 0, magnitude: 0, killCount: 0 });
});

test("prevents mitigated hits from subtracting damage from other hits", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 0: 1, 5, 20",
    armorBody: "4",
    toughnessBonus: "3",
  });
  expect(result.entries.map((entry) => entry.kind === "hit" && entry.finalDamage))
    .toEqual([0, 0, 13]);
  expect(result.totals.damage).toBe(13);
});

test("clamps armor and Toughness to zero without increasing damage", () => {
  const result = makeResult({
    attackSummaryString: "Pen 10, Fel 10: 5",
    armorBody: "4",
    toughnessBonus: "3",
  });
  expect(result.entries[0]).toMatchObject({
    effectiveArmor: 0,
    effectiveToughnessBonus: 0,
    finalDamage: 5,
  });
});

test("clamps both true and bonus Horde hits before assigning magnitude", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 0: 1, 5, 20",
    armorBody: "4",
    toughnessBonus: "3",
    trueHits: "1",
    magPer: "6",
    woundsPer: "20",
  });
  expect(result.entries.map((entry) =>
    entry.kind === "hit" && entry.mode === "horde"
      ? [entry.finalDamage, entry.magnitude]
      : null
  )).toEqual([[0, 0], [0, 0], [13, 1]]);
  expect(result.totals).toEqual({ damage: 13, magnitude: 1, killCount: 0 });
});

test("rejects unsafe accumulated totals rather than returning a rounded result", () => {
  const draft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0: 9007199254740991, 1",
    firstHitLocation: "Body",
  };
  const normalized = normalizeWarhammerDefenderDamage(draft);
  if (!normalized.request) throw new Error("Expected valid request");
  expect(() => calculateWarhammerDefenderDamage(draft, normalized.request)).toThrow(/safe whole-number/);
});

test("uses per-location armor so each arm and leg is independent", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 0: 20, 20",
    firstHitLocation: "Left Arm",
    advancedEnabled: true,
    advancedArmorLeftArm: "4",
    advancedArmorRightArm: "1",
  });
  expect(
    result.entries.map((entry) =>
      entry.kind === "hit"
        ? [entry.location, entry.armorBeforePenetration, entry.finalDamage]
        : null
    )
  ).toEqual([
    ["Left Arm", 4, 16],
    ["Body", 0, 20],
  ]);
});

test("hides the Armor term only when an override is zero", () => {
  const reduced = makeResult({
    attackSummaryString: "Pen 5: 20",
    firstHitLocation: "Head",
    advancedEnabled: true,
    advancedArmorHead: "3",
  });
  expect(reduced.entries[0]).toMatchObject({
    armorBeforePenetration: 3,
    effectiveArmor: 0,
    showArmorTerm: true,
    finalDamage: 20,
  });

  const blank = makeResult({
    attackSummaryString: "Pen 5: 20",
    firstHitLocation: "Head",
    advancedEnabled: true,
  });
  expect(blank.entries[0]).toMatchObject({
    armorBeforePenetration: 0,
    effectiveArmor: 0,
    showArmorTerm: false,
    finalDamage: 20,
  });
});

test("adds the location Toughness before Fortitude doubles it", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 1: 12, 9",
    firstHitLocation: "Head",
    toughnessBonus: "3",
    fortitude: "1",
    advancedEnabled: true,
    advancedToughnessHead: "1",
  });
  expect(result.entries.map((entry) =>
    entry.kind === "hit"
      ? {
          location: entry.location,
          fortitudeApplied: entry.fortitudeApplied,
          beforeFelling: entry.toughnessBeforeFelling,
          effective: entry.effectiveToughnessBonus,
          finalDamage: entry.finalDamage,
        }
      : null
  )).toEqual([
    { location: "Head", fortitudeApplied: true, beforeFelling: 8, effective: 7, finalDamage: 5 },
    { location: "Right Arm", fortitudeApplied: false, beforeFelling: 3, effective: 2, finalDamage: 7 },
  ]);
});

test("lets Felling erode the location Toughness add-on", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 2: 20",
    firstHitLocation: "Body",
    toughnessBonus: "1",
    advancedEnabled: true,
    advancedToughnessBody: "2",
  });
  expect(result.entries[0]).toMatchObject({
    toughnessBeforeFelling: 3,
    effectiveToughnessBonus: 1,
    finalDamage: 19,
  });
});

test("combines per-location armor and Toughness for the worked example", () => {
  const result = makeResult({
    attackSummaryString: "Pen 2, Fel 1: 12, 9, 5",
    firstHitLocation: "Head",
    toughnessBonus: "3",
    fortitude: "1",
    advancedEnabled: true,
    advancedArmorHead: "4",
    advancedArmorBody: "2",
    advancedArmorLeftArm: "1",
    advancedArmorRightArm: "1",
    advancedToughnessHead: "1",
  });
  expect(
    result.entries.map((entry) =>
      entry.kind === "hit"
        ? [entry.location, entry.effectiveArmor, entry.effectiveToughnessBonus, entry.finalDamage]
        : null
    )
  ).toEqual([
    ["Head", 2, 7, 3],
    ["Right Arm", 0, 2, 7],
    ["Body", 0, 2, 3],
  ]);
  expect(result.totals.damage).toBe(13);
});

test("applies per-location armor to Horde bonus hits", () => {
  const result = makeResult({
    attackSummaryString: "Pen 0, Fel 0: 20, 20, 20",
    firstHitLocation: "Body",
    toughnessBonus: "0",
    trueHits: "1",
    magPer: "6",
    woundsPer: "20",
    advancedEnabled: true,
    advancedArmorBody: "10",
  });
  expect(result.entries.map((entry) =>
    entry.kind === "hit" && entry.mode === "horde"
      ? [entry.location, entry.finalDamage, entry.magnitude]
      : null
  )).toEqual([
    ["Body", 10, 3],
    ["Left Leg", 20, 1],
    ["Right Arm", 20, 1],
  ]);
  expect(result.totals).toEqual({ damage: 50, magnitude: 5, killCount: 0 });
});
