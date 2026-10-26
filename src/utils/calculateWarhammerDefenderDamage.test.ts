import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import calculateWarhammerDefenderDamage from "./calculateWarhammerDefenderDamage";
import normalizeWarhammerDefenderDamage from "./normalizeWarhammerDefenderDamage";

const makeResult = (patch: Partial<WarhammerDefenderDamageDraft>) => {
  const draft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0: 20, 10, 5, 55",
    firstHitLocation: "Body",
    ...patch,
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
    attackSummaryString: "Pen 0, Fel 2: 20, 20, 20, 20, 20,",
    toughnessBonus: "6", fortitude: "1", trueHits: "2", magPer: "6", woundsPer: "20", devastating: "1",
  });
  expect(result.entries.map((hit) => hit.kind === "hit" && hit.fortitudeApplied))
    .toEqual([true, false, true, true, false, false]);
  expect(result.entries[0]).toMatchObject({ classification: "partial-overkill", magnitude: 4 });
  expect(result.totals).toEqual({ damage: 62, magnitude: 12, killCount: 2 });
});

test.each(["0", "1", "4"])("accepts excess Fortitude with %s true hits and preserves synthetic Devastating", (trueHits) => {
  const result = makeResult({
    toughnessBonus: "6", fortitude: String(Number.MAX_SAFE_INTEGER),
    trueHits, magPer: "6", woundsPer: "20", devastating: "1",
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
    trueHits: "3",
    magPer: "6",
    devastating: "1",
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
    attackSummaryString: "Pen 0, Fel 0: 0, -1",
    trueHits: "2",
    magPer: "6",
    devastating: "4",
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
