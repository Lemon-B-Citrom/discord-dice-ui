import normalizeWarhammerAttackerDamage, {
  WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
} from "./normalizeWarhammerAttackerDamage";
import { AttackerDamageValues } from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

const emptyValues: AttackerDamageValues = {
  hits: "",
  damageDice: "",
  damageModifier: "",
  penetration: "",
  felling: "",
  devastating: "",
  proven: "",
  rfOn: "",
  rfConfirmsOn: "",
  tearing: "none",
};

test("uses the shared defaults for blank fields", () => {
  expect(normalizeWarhammerAttackerDamage(emptyValues)).toEqual({
    input: WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
    errors: {},
  });
});

test("preserves explicit zeroes and permits a signed damage modifier", () => {
  const result = normalizeWarhammerAttackerDamage({
    ...emptyValues,
    hits: "2",
    damageModifier: "-3",
    proven: "0",
  });

  expect(result.input).toMatchObject({
    hits: 2,
    damageModifier: -3,
    proven: 0,
  });
  expect(result.errors).toEqual({});
});

test("parses Devastating and rejects values that are not whole numbers", () => {
  const parsed = normalizeWarhammerAttackerDamage({
    ...emptyValues,
    devastating: "4",
  });
  const negative = normalizeWarhammerAttackerDamage({
    ...emptyValues,
    devastating: "-2",
  });
  const fractional = normalizeWarhammerAttackerDamage({
    ...emptyValues,
    devastating: "1.5",
  });

  expect(parsed.input?.devastating).toBe(4);
  expect(parsed.errors).toEqual({});
  expect(negative.errors.devastating).toBeDefined();
  expect(fractional.errors.devastating).toBeDefined();
});

test("rejects negative non-modifier values and invalid hit counts", () => {
  const negative = normalizeWarhammerAttackerDamage({
    ...emptyValues,
    hits: "2",
    damageDice: "1",
    penetration: "-1",
  });
  const invalidHits = normalizeWarhammerAttackerDamage({ ...emptyValues, hits: "0" });

  expect(negative.input).toBeUndefined();
  expect(negative.errors.penetration).toBeDefined();
  expect(invalidHits.errors.hits).toBeDefined();
});
