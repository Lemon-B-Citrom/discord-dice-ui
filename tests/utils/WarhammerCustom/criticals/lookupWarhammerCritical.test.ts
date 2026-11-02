import {
  HUMANOID_CRITICAL_TABLES,
  VEHICLE_CRITICAL_TABLES,
} from "../../../../src/utils/WarhammerCustom/criticals/criticalTables";
import { lookupWarhammerCritical } from "../../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";

HUMANOID_CRITICAL_TABLES.forEach((table) =>
  test(`looks up all ten ${table.damageType}/${table.location} rows exactly`, () => {
    table.rows.forEach((row) => {
      const result = lookupWarhammerCritical({
        family: "humanoid",
        location: table.location,
        damageType: table.damageType as any,
        severity: row.severity,
      });
      expect(result.effect.text).toBe(row.text);
      expect(result.effect.rowLabel).toBe(row.rowLabel);
      expect(result.effect.source).toBe(row.source);
      expect(result.request.severity).toBe(row.severity);
      expect(result.prerequisites.length).toBe(
        row.prerequisiteSeverity === undefined ? 0 : 1
      );
    });
  })
);

VEHICLE_CRITICAL_TABLES.forEach((table) =>
  test(`looks up all ten vehicle ${table.location} rows exactly`, () => {
    table.rows.forEach((row) => {
      const result = lookupWarhammerCritical({
        family: "vehicle",
        location: table.location,
        severity: row.severity,
      });
      expect(result.effect.text).toBe(row.text);
      expect(result.effect.rowLabel).toBe(row.rowLabel);
      expect(result.effect.source).toBe(row.source);
      expect(result.effect.damageType).toBeUndefined();
    });
  })
);

test("returns one selected humanoid damage type and the 10+ table row", () => {
  const result = lookupWarhammerCritical({
    family: "humanoid",
    location: "body",
    damageType: "Impact",
    severity: 10,
  });

  expect(result.effect.rowLabel).toBe("10+");
  expect(result.effect.damageType).toBe("Impact");
  expect(result.effect.text).toContain("As per the effect directly above");
  expect(result.prerequisites[0].rowLabel).toBe("9");
  expect(result.prerequisites[0].text).toContain("crumpling to the ground dead");
});

test("resolves explicit prerequisite rows, including the weapon result-5 rule", () => {
  const hull = lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 8,
  });
  const fixedWeapon = lookupWarhammerCritical({
    family: "vehicle",
    location: "weapon",
    severity: 4,
  });

  expect(hull.effect.text).toContain("effect directly above");
  expect(hull.prerequisites[0].rowLabel).toBe("7");
  expect(fixedWeapon.effect.text).toContain("treat this as the result 5");
  expect(fixedWeapon.prerequisites[0].rowLabel).toBe("5");
});

test("is deterministic and rejects invalid severity or table identities", () => {
  const random = jest.spyOn(Math, "random");
  const request = {
    family: "vehicle" as const,
    location: "turret" as const,
    severity: 10 as const,
  };
  expect(lookupWarhammerCritical(request)).toEqual(
    lookupWarhammerCritical(request)
  );
  expect(random).not.toHaveBeenCalled();
  random.mockRestore();

  expect(() =>
    lookupWarhammerCritical({ ...request, severity: 11 as any })
  ).toThrow("Critical severity must be a whole number from 1 to 10");
  expect(() =>
    lookupWarhammerCritical({
      family: "humanoid",
      location: "turret" as any,
      damageType: "Impact",
      severity: 1,
    })
  ).toThrow("Critical effect data is unavailable for this selection");
});
