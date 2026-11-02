import {
  CRITICAL_DAMAGE_REQUIRED_ERROR,
  normalizeWarhammerCritical,
} from "../../../../src/utils/WarhammerCustom/criticals/normalizeWarhammerCritical";

describe("normalizeWarhammerCritical", () => {
  test("accepts the inclusive 1–10 range and retains severity 10", () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((severity) => {
      const normalized = normalizeWarhammerCritical(
        String(severity),
        "humanoid",
        "head",
        "Impact"
      );
      expect(normalized.request).toEqual({
        severity,
        family: "humanoid",
        location: "head",
        damageType: "Impact",
      });
    });
  });

  test("trims outer whitespace and accepts digit-only leading zeroes", () => {
    expect(
      normalizeWarhammerCritical(" 010 ", "vehicle", "hull").request
    ).toEqual({ severity: 10, family: "vehicle", location: "hull" });
  });

  test.each([
    "",
    "   ",
    "0",
    "11",
    "-1",
    "+1",
    "1.0",
    "1e0",
    "1x",
    "9007199254740992",
  ])("rejects invalid Damage text %j with the required message", (damage) => {
    expect(
      normalizeWarhammerCritical(damage, "vehicle", "hull")
    ).toEqual({
      request: null,
      errors: { damage: CRITICAL_DAMAGE_REQUIRED_ERROR },
    });
  });

  test("rejects unknown or mismatched family, location, and damage type", () => {
    expect(
      normalizeWarhammerCritical("1", "humanoid", "turret" as any, "Impact")
        .request
    ).toBeNull();
    expect(
      normalizeWarhammerCritical("1", "vehicle", "head" as any).request
    ).toBeNull();
    expect(
      normalizeWarhammerCritical("1", "humanoid", "head").request
    ).toBeNull();
    expect(
      normalizeWarhammerCritical("1", "vehicle", "hull", "Impact" as any)
        .request
    ).toBeNull();
  });

  test("rejects a non-string runtime value without throwing", () => {
    expect(
      normalizeWarhammerCritical(undefined as any, "vehicle", "hull")
    ).toEqual({
      request: null,
      errors: { damage: CRITICAL_DAMAGE_REQUIRED_ERROR },
    });
  });
});
