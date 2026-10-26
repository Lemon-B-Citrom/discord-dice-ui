import normalizeWarhammerAttack, {
  WARHAMMER_ATTACK_DEFAULTS,
} from "./normalizeWarhammerAttack";
import { AttackCalculatorValues } from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";

const emptyValues: AttackCalculatorValues = {
  hits: "",
  damageDice: "",
  damageModifier: "",
  penetration: "",
  felling: "",
  proven: "",
  rfOn: "",
  rfConfirmsOn: "",
  tearing: "none",
};

test("uses the shared defaults for blank fields", () => {
  expect(normalizeWarhammerAttack(emptyValues)).toEqual({
    input: WARHAMMER_ATTACK_DEFAULTS,
    errors: {},
  });
});

test("preserves explicit zeroes and permits a signed damage modifier", () => {
  const result = normalizeWarhammerAttack({
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

test("rejects negative non-modifier values and invalid hit counts", () => {
  const negative = normalizeWarhammerAttack({
    ...emptyValues,
    hits: "2",
    damageDice: "1",
    penetration: "-1",
  });
  const invalidHits = normalizeWarhammerAttack({ ...emptyValues, hits: "0" });

  expect(negative.input).toBeUndefined();
  expect(negative.errors.penetration).toBeDefined();
  expect(invalidHits.errors.hits).toBeDefined();
});
