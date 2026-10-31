import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import resolveWarhammerArmorLayout from "../../src/utils/resolveWarhammerArmorLayout";

const resolve = (patch: Partial<WarhammerDefenderDamageDraft>) =>
  resolveWarhammerArmorLayout({ ...EMPTY_DEFENDER_DAMAGE_DRAFT, ...patch });

test("inherits Body alone and one supplied non-Body part, preserving explicit zero", () => {
  expect(resolve({ armorBody: "4" }).armor).toEqual({
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
  });

  expect(resolve({ armorBody: "4", armorArms: "0" }).armor).toEqual({
    headAP: 0,
    bodyAP: 4,
    armsAP: 0,
    legsAP: 0,
    sources: {
      headAP: "other-part",
      bodyAP: "explicit",
      armsAP: "explicit",
      legsAP: "other-part",
    },
  });
});

test("accepts explicit armor for all four humanoid locations", () => {
  expect(
    resolve({
      armorHead: "8",
      armorBody: "10",
      armorArms: "8",
      armorLegs: "8",
    }).armor
  ).toEqual({
    headAP: 8,
    bodyAP: 10,
    armsAP: 8,
    legsAP: 8,
    sources: {
      headAP: "explicit",
      bodyAP: "explicit",
      armsAP: "explicit",
      legsAP: "explicit",
    },
  });
});

test.each(Array.from({ length: 16 }, (_, mask) => mask))(
  "returns an armor layout exactly when the supplied-field mask %s is complete or inheritable",
  (mask) => {
    const fields = [
      "armorHead",
      "armorBody",
      "armorArms",
      "armorLegs",
    ] as const;
    const patch = fields.reduce<Partial<WarhammerDefenderDamageDraft>>(
      (values, field, index) => {
        if ((mask & (1 << index)) !== 0) values[field] = "4";
        return values;
      },
      {}
    );
    const result = resolve(patch);
    const suppliedCount = fields.filter(
      (_, index) => (mask & (1 << index)) !== 0
    ).length;
    const bodySupplied = (mask & (1 << 1)) !== 0;
    const valid =
      suppliedCount === 0 ||
      suppliedCount === fields.length ||
      (bodySupplied && suppliedCount <= 2);

    expect(Boolean(result.armor)).toBe(valid);
    expect(Object.keys(result.errors).length === 0).toBe(valid);
  }
);

test("rejects incomplete layouts after two other parts and malformed supplied values", () => {
  const incomplete = resolve({
    armorBody: "4",
    armorArms: "2",
    armorHead: "1",
  });
  expect(incomplete.armor).toBeNull();
  expect(incomplete.errors.armorLegs).toBeTruthy();

  const malformed = resolve({ armorBody: "4", armorArms: "nope" });
  expect(malformed.armor).toBeNull();
  expect(malformed.errors.armorArms).toBeTruthy();
});
