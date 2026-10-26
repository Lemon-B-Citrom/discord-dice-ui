import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import normalizeWarhammerDefenderDamage from "./normalizeWarhammerDefenderDamage";

const validDraft = (patch: Partial<WarhammerDefenderDamageDraft> = {}) => ({
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  attackSummaryString: "Pen 0, Fel 0: 5, 6",
  firstHitLocation: "Body",
  ...patch,
});

test.each(["", "0", "2", String(Number.MAX_SAFE_INTEGER)])("accepts Fortitude %p without enabling Horde", (fortitude) => {
  expect(normalizeWarhammerDefenderDamage(validDraft({ fortitude })).request).toMatchObject({
    mode: "single", fortitude: Number(fortitude),
  });
});

test.each(["-1", "1.5", "abc", "9007199254740992"])("rejects invalid Fortitude %p", (fortitude) => {
  const normalized = normalizeWarhammerDefenderDamage(validDraft({ fortitude }));
  expect(normalized.request).toBeNull();
  expect(normalized.errors.fortitude).toBeTruthy();
});

test("distinguishes all-blank single mode from explicit-zero Horde mode", () => {
  const single = normalizeWarhammerDefenderDamage(validDraft());
  expect(single.request && single.request.mode).toBe("single");

  const horde = normalizeWarhammerDefenderDamage(
    validDraft({ trueHits: "0", magPer: "0", devastating: "0", woundsPer: "0" })
  );
  expect(horde.request).toMatchObject({
    mode: "horde",
    trueHits: 0,
    magPer: 0,
    devastating: 0,
    woundsPer: 0,
  });
});

test("requires complete Horde fields and rejects a true-hit count above the parsed count", () => {
  const incomplete = normalizeWarhammerDefenderDamage(validDraft({ trueHits: "0" }));
  expect(incomplete.request).toBeNull();
  expect(incomplete.errors.magPer).toBeTruthy();

  const tooMany = normalizeWarhammerDefenderDamage(
    validDraft({ trueHits: "3", magPer: "1", devastating: "0", woundsPer: "1" })
  );
  expect(tooMany.request).toBeNull();
  expect(tooMany.errors.trueHits).toBeTruthy();
});

test("allows Devastating to be blank in Horde mode and defaults it to zero", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ trueHits: "1", magPer: "2", woundsPer: "4" })
  );

  expect(normalized.request).toMatchObject({
    mode: "horde",
    trueHits: 1,
    magPer: 2,
    devastating: 0,
    woundsPer: 4,
  });
  expect(normalized.errors).toEqual({});
});

test("still validates Devastating when a value is supplied", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({
      trueHits: "1",
      magPer: "2",
      devastating: "not a number",
      woundsPer: "4",
    })
  );

  expect(normalized.request).toBeNull();
  expect(normalized.errors.devastating).toBeTruthy();
});
