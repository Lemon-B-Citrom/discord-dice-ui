import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import resolveWarhammerArmorLayout from "./resolveWarhammerArmorLayout";

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

test("rejects incomplete layouts after two other parts and malformed supplied values", () => {
  const incomplete = resolve({ armorBody: "4", armorArms: "2", armorHead: "1" });
  expect(incomplete.armor).toBeNull();
  expect(incomplete.errors.armorLegs).toBeTruthy();

  const malformed = resolve({ armorBody: "4", armorArms: "nope" });
  expect(malformed.armor).toBeNull();
  expect(malformed.errors.armorArms).toBeTruthy();
});
