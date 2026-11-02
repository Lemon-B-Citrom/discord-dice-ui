import {
  CRITICAL_DAMAGE_TYPES,
  CRITICAL_LOCATION_GROUPS,
  HUMANOID_CRITICAL_TABLES,
  VEHICLE_CRITICAL_TABLES,
} from "../../../../src/utils/WarhammerCustom/criticals/criticalTables";
import { lookupWarhammerCritical } from "../../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";

test("contains every verified humanoid and vehicle table row exactly once", () => {
  expect(HUMANOID_CRITICAL_TABLES).toHaveLength(16);
  expect(VEHICLE_CRITICAL_TABLES).toHaveLength(4);
  expect(
    HUMANOID_CRITICAL_TABLES.reduce(
      (total, table) => total + table.rows.length,
      0
    )
  ).toBe(160);
  expect(
    VEHICLE_CRITICAL_TABLES.reduce(
      (total, table) => total + table.rows.length,
      0
    )
  ).toBe(40);

  const keys = HUMANOID_CRITICAL_TABLES.concat(VEHICLE_CRITICAL_TABLES).map(
    (table) => `${table.family}:${table.damageType || ""}:${table.location}`
  );
  expect(new Set(keys).size).toBe(keys.length);
  HUMANOID_CRITICAL_TABLES.concat(VEHICLE_CRITICAL_TABLES).forEach((table) => {
    expect(table.rows.map((row) => row.rowLabel)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10+",
    ]);
    table.rows.forEach((row) => {
      expect(row.text.trim().length).toBeGreaterThan(0);
      expect(row.source).toContain(".pdf");
      if (row.prerequisiteSeverity !== undefined) {
        expect(
          table.rows.some(
            (candidate) => candidate.severity === row.prerequisiteSeverity
          )
        ).toBe(true);
      }
    });
  });
});

test("has all humanoid damage types and locations and the required menu ordering", () => {
  expect(CRITICAL_DAMAGE_TYPES).toEqual([
    "Energy",
    "Explosive",
    "Impact",
    "Rending",
  ]);
  expect(CRITICAL_LOCATION_GROUPS).toEqual([
    {
      family: "humanoid",
      label: "Humanoid",
      locations: [
        { id: "head", label: "Head" },
        { id: "body", label: "Body" },
        { id: "arm", label: "Arm" },
        { id: "leg", label: "Leg" },
      ],
    },
    {
      family: "vehicle",
      label: "Vehicle",
      locations: [
        { id: "motiveSystem", label: "Motive System" },
        { id: "hull", label: "Hull" },
        { id: "weapon", label: "Weapon" },
        { id: "turret", label: "Turret" },
      ],
    },
  ]);
  CRITICAL_DAMAGE_TYPES.forEach((damageType) => {
    ["head", "body", "arm", "leg"].forEach((location) => {
      expect(
        HUMANOID_CRITICAL_TABLES.some(
          (table) =>
            table.damageType === damageType && table.location === location
        )
      ).toBe(true);
    });
  });
});

test("uses the visually verified PDF wording for known extraction errors", () => {
  const impactHead = HUMANOID_CRITICAL_TABLES.find(
    (table) => table.damageType === "Impact" && table.location === "head"
  );
  const impactLeg = HUMANOID_CRITICAL_TABLES.find(
    (table) => table.damageType === "Impact" && table.location === "leg"
  );

  expect(impactHead?.rows[5].text).toContain("Agility Test");
  expect(impactHead?.rows[5].text).not.toContain("Agility aest");
  expect(impactLeg?.rows[6].text).toContain("Stunned for 2 rounds");
  expect(impactLeg?.rows[6].text).not.toContain("2 round and");
});

test("records same-table prerequisites without replacing selected source text", () => {
  const vehicleHull = VEHICLE_CRITICAL_TABLES.find(
    (table) => table.location === "hull"
  );
  const energyBody = HUMANOID_CRITICAL_TABLES.find(
    (table) => table.damageType === "Energy" && table.location === "body"
  );
  const weapon = VEHICLE_CRITICAL_TABLES.find(
    (table) => table.location === "weapon"
  );

  expect(vehicleHull?.rows[7].text).toContain("effect directly above");
  expect(vehicleHull?.rows[7].prerequisiteSeverity).toBe(7);
  expect(energyBody?.rows[9].text).toMatch(/^As above/);
  expect(energyBody?.rows[9].prerequisiteSeverity).toBe(9);
  expect(weapon?.rows[3].text).toContain("treat this as the result 5");
  expect(weapon?.rows[3].prerequisiteSeverity).toBe(5);
});

test("preserves the conditional Explosive Arm 3 reference to row 9", () => {
  const result = lookupWarhammerCritical({
    family: "humanoid",
    location: "arm",
    damageType: "Explosive",
    severity: 3,
  });

  expect(result.effect.text).toContain("immediately resolve the 9 effect");
  expect(result.effect.prerequisiteSeverity).toBe(9);
  expect(result.prerequisites).toHaveLength(1);
  expect(result.prerequisites[0].rowLabel).toBe("9");
});
