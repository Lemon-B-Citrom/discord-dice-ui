import {
  ADVANCED_DEFENSE_FIELD_KEYS,
  ADVANCED_DEFENSE_FIELDS,
} from "./advancedDefenses";
import normalizeAdvancedDefenses from "./advancedDefenses";
import {
  AdvancedDefenseField,
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { NON_NEGATIVE_INTEGER_ERROR } from "./safeInteger";

const advancedDraft = (
  patch: Partial<WarhammerDefenderDamageDraft> = {}
): WarhammerDefenderDamageDraft => ({
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  advancedEnabled: true,
  ...patch,
});

const withField = (field: AdvancedDefenseField, value: string) => {
  const draft = advancedDraft();
  draft[field] = value;
  return draft;
};

test("ignores stored overrides while advanced mode is disabled", () => {
  const result = normalizeAdvancedDefenses({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    advancedArmorHead: "4",
    advancedToughnessRightLeg: "2",
  });
  expect(result.defenses).toBeNull();
  expect(result.errors).toEqual({});
});

test("treats blank overrides as zero armor and zero Toughness", () => {
  const result = normalizeAdvancedDefenses(advancedDraft());
  expect(result.errors).toEqual({});
  expect(result.defenses).not.toBeNull();
  ADVANCED_DEFENSE_FIELDS.forEach(({ location }) => {
    expect(result.defenses?.armor[location]).toBe(0);
    expect(result.defenses?.toughnessBonus[location]).toBe(0);
  });
});

test("keeps every body part independent, including each arm and leg", () => {
  const draft = advancedDraft({
    advancedArmorHead: "4",
    advancedArmorBody: "2",
    advancedArmorLeftArm: "1",
    advancedArmorRightArm: "3",
    advancedToughnessHead: "1",
    advancedToughnessLeftLeg: "5",
  });
  const result = normalizeAdvancedDefenses(draft);
  expect(result.defenses).toEqual({
    armor: {
      Head: 4,
      Body: 2,
      "Left Arm": 1,
      "Right Arm": 3,
      "Left Leg": 0,
      "Right Leg": 0,
    },
    toughnessBonus: {
      Head: 1,
      Body: 0,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 5,
      "Right Leg": 0,
    },
  });
  expect(result.errors).toEqual({});
});

test("exposes twelve distinct draft field keys", () => {
  expect(ADVANCED_DEFENSE_FIELD_KEYS).toHaveLength(12);
  expect(new Set(ADVANCED_DEFENSE_FIELD_KEYS).size).toBe(12);
});

test.each(ADVANCED_DEFENSE_FIELD_KEYS)(
  "rejects a negative value in %s without a partial result",
  (field) => {
    const result = normalizeAdvancedDefenses(withField(field, "-1"));
    expect(result.defenses).toBeNull();
    expect(result.errors[field]).toBe(NON_NEGATIVE_INTEGER_ERROR);
  }
);

test.each(["1.5", "abc", "9007199254740992", " 2 2"])(
  "rejects the invalid override %p",
  (value) => {
    const result = normalizeAdvancedDefenses(
      withField("advancedArmorBody", value)
    );
    expect(result.defenses).toBeNull();
    expect(result.errors.advancedArmorBody).toBe(NON_NEGATIVE_INTEGER_ERROR);
  }
);

test("keeps the valid overrides while reporting the invalid ones", () => {
  const result = normalizeAdvancedDefenses(
    advancedDraft({ advancedArmorHead: "4", advancedToughnessHead: "x" })
  );
  expect(result.defenses).toBeNull();
  expect(result.errors).toEqual({
    advancedToughnessHead: NON_NEGATIVE_INTEGER_ERROR,
  });
});
