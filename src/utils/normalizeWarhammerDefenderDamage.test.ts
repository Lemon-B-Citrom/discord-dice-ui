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
    validDraft({ trueHits: "0", magPer: "0", woundsPer: "0" })
  );
  expect(horde.request).toMatchObject({
    mode: "horde",
    trueHits: 0,
    magPer: 0,
    woundsPer: 0,
  });
});

test("requires complete Horde fields and rejects a true-hit count above the parsed count", () => {
  const incomplete = normalizeWarhammerDefenderDamage(validDraft({ trueHits: "0" }));
  expect(incomplete.request).toBeNull();
  expect(incomplete.errors.magPer).toBeTruthy();

  const tooMany = normalizeWarhammerDefenderDamage(
    validDraft({ trueHits: "3", magPer: "1", woundsPer: "1" })
  );
  expect(tooMany.request).toBeNull();
  expect(tooMany.errors.trueHits).toBeTruthy();
});

test("reads Devastating from the parsed summary and defaults it to zero when absent", () => {
  const withDevastating = normalizeWarhammerDefenderDamage(
    validDraft({
      attackSummaryString: "Pen 0, Dev 3: 5, 6",
      trueHits: "1",
      magPer: "2",
      woundsPer: "4",
    })
  );
  expect(withDevastating.request).toMatchObject({
    mode: "horde",
    summary: { penetration: 0, felling: 0, devastating: 3, damages: [5, 6] },
  });

  const withoutDevastating = normalizeWarhammerDefenderDamage(
    validDraft({ trueHits: "1", magPer: "2", woundsPer: "4" })
  );
  expect(withoutDevastating.request).toMatchObject({
    mode: "horde",
    summary: { penetration: 0, felling: 0, devastating: 0, damages: [5, 6] },
  });
  expect(withoutDevastating.errors).toEqual({});
});

test("accepts a summary without Fel or Dev and treats both traits as zero", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ attackSummaryString: "Pen 4: 5, 6" })
  );

  expect(normalized.request?.summary).toEqual({
    penetration: 4,
    felling: 0,
    devastating: 0,
    damages: [5, 6],
  });
});
