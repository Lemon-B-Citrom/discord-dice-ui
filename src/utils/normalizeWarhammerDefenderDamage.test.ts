import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerAdvancedDefenses,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageRequest,
  WarhammerHumanoidDamageRequest,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import normalizeWarhammerDefenderDamage from "./normalizeWarhammerDefenderDamage";
import { NON_NEGATIVE_INTEGER_ERROR } from "./safeInteger";

const zeroAdvancedDefenses: WarhammerAdvancedDefenses = {
  armor: {
    Head: 0,
    Body: 0,
    "Left Arm": 0,
    "Right Arm": 0,
    "Left Leg": 0,
    "Right Leg": 0,
  },
  toughnessBonus: {
    Head: 0,
    Body: 0,
    "Left Arm": 0,
    "Right Arm": 0,
    "Left Leg": 0,
    "Right Leg": 0,
  },
};

const validDraft = (patch: Partial<WarhammerDefenderDamageDraft> = {}) => ({
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  attackSummaryString: "Pen 0, Fel 0, @body: 5 6",
  ...patch,
  // Horde mode is opt-in, so a patch that supplies Horde fields ticks the box.
  hordeEnabled:
    patch.hordeEnabled ??
    ("bonusHits" in patch || "magPer" in patch || "woundsPer" in patch),
});

/** Every valid draft here is humanoid, so only that branch can be reachable. */
const humanoidRequest = (
  request: WarhammerDefenderDamageRequest | null
): WarhammerHumanoidDamageRequest => {
  if (!request || request.targetFamily !== "humanoid") {
    throw new Error("Expected a humanoid damage request");
  }
  return request;
};

test.each(["", "0", "2", String(Number.MAX_SAFE_INTEGER)])(
  "accepts Fortitude %p without enabling Horde",
  (fortitude) => {
    expect(
      normalizeWarhammerDefenderDamage(validDraft({ fortitude })).request
    ).toMatchObject({
      mode: "single",
      fortitude: Number(fortitude),
    });
  }
);

test.each(["-1", "1.5", "abc", "9007199254740992"])(
  "rejects invalid Fortitude %p",
  (fortitude) => {
    const normalized = normalizeWarhammerDefenderDamage(
      validDraft({ fortitude })
    );
    expect(normalized.request).toBeNull();
    expect(normalized.errors.fortitude).toBeTruthy();
  }
);

test("distinguishes all-blank single mode from explicit-zero Horde mode", () => {
  const single = normalizeWarhammerDefenderDamage(validDraft());
  expect(single.request && single.request.mode).toBe("single");

  // Two hits, both of them bonus hits, so no true hits are left.
  const horde = normalizeWarhammerDefenderDamage(
    validDraft({ bonusHits: "2", magPer: "0", woundsPer: "0" })
  );
  expect(horde.request).toMatchObject({
    mode: "horde",
    trueHits: 0,
    magPer: 0,
    woundsPer: 0,
  });
});

test("ignores Horde fields until the Enable box is ticked", () => {
  const normalized = normalizeWarhammerDefenderDamage({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0, @body: 5 6",
    bonusHits: "3",
    magPer: "2",
    woundsPer: "-1",
  });

  expect(normalized.request?.mode).toBe("single");
  expect(normalized.errors).toEqual({});
});

test("defaults Bonus Hits to zero and rejects more bonus hits than the parsed count", () => {
  const blank = normalizeWarhammerDefenderDamage(
    validDraft({ magPer: "2", woundsPer: "4" })
  );
  expect(blank.errors).toEqual({});
  expect(blank.request).toMatchObject({ mode: "horde", trueHits: 2 });

  const incomplete = normalizeWarhammerDefenderDamage(
    validDraft({ bonusHits: "0" })
  );
  expect(incomplete.request).toBeNull();
  expect(incomplete.errors.magPer).toBeTruthy();

  const tooMany = normalizeWarhammerDefenderDamage(
    validDraft({ bonusHits: "3", magPer: "1", woundsPer: "1" })
  );
  expect(tooMany.request).toBeNull();
  expect(tooMany.errors.bonusHits).toBeTruthy();
});

test("reads Devastating from the parsed summary and defaults it to zero when absent", () => {
  const withDevastating = normalizeWarhammerDefenderDamage(
    validDraft({
      attackSummaryString: "Pen 0, Dev 3, @body: 5 6",
      bonusHits: "1",
      magPer: "2",
      woundsPer: "4",
    })
  );
  expect(withDevastating.request).toMatchObject({
    mode: "horde",
    summary: {
      penetration: 0,
      felling: 0,
      devastating: 3,
      firstHitLocation: "Body",
      damages: [5, 6],
    },
  });

  const withoutDevastating = normalizeWarhammerDefenderDamage(
    validDraft({ bonusHits: "1", magPer: "2", woundsPer: "4" })
  );
  expect(withoutDevastating.request).toMatchObject({
    mode: "horde",
    summary: {
      penetration: 0,
      felling: 0,
      devastating: 0,
      firstHitLocation: "Body",
      damages: [5, 6],
    },
  });
  expect(withoutDevastating.errors).toEqual({});
});

test("accepts a summary without Fel or Dev and treats both traits as zero", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ attackSummaryString: "Pen 4, @body: 5 6" })
  );

  expect(normalized.request?.summary).toEqual({
    penetration: 4,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [5, 6],
  });
});

test("uses the inherited armor slots while advanced mode is off", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ armorBody: "4" })
  );
  expect(humanoidRequest(normalized.request).defenses).toEqual({
    mode: "simple",
    armor: {
      headAP: 4,
      bodyAP: 4,
      armsAP: 4,
      legsAP: 4,
      sources: {
        headAP: "body",
        bodyAP: "explicit",
        armsAP: "body",
        legsAP: "body",
      },
    },
  });
});

test("ignores the simple armor rules while advanced mode is on", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ advancedEnabled: true, armorHead: "7" })
  );
  expect(normalized.errors).toEqual({});
  expect(humanoidRequest(normalized.request).defenses).toEqual({
    mode: "advanced",
    ...zeroAdvancedDefenses,
  });
});

test("reads per-location overrides and keeps both sides independent", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({
      advancedEnabled: true,
      advancedArmorLeftArm: "1",
      advancedArmorRightArm: "3",
      advancedToughnessHead: "2",
    })
  );
  expect(normalized.errors).toEqual({});
  expect(humanoidRequest(normalized.request).defenses).toEqual({
    mode: "advanced",
    armor: {
      Head: 0,
      Body: 0,
      "Left Arm": 1,
      "Right Arm": 3,
      "Left Leg": 0,
      "Right Leg": 0,
    },
    toughnessBonus: {
      Head: 2,
      Body: 0,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
  });
});

test("rejects an invalid override under its own field key", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ advancedEnabled: true, advancedToughnessLeftLeg: "-2" })
  );
  expect(normalized.request).toBeNull();
  expect(normalized.errors.advancedToughnessLeftLeg).toBe(
    NON_NEGATIVE_INTEGER_ERROR
  );
});

test("keeps stored overrides inert and invalid ones harmless while the mode is off", () => {
  const normalized = normalizeWarhammerDefenderDamage(
    validDraft({ advancedArmorHead: "-1", advancedToughnessBody: "abc" })
  );
  expect(normalized.errors).toEqual({});
  expect(humanoidRequest(normalized.request).defenses.mode).toBe("simple");
});
