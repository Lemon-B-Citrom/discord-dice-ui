import {
  DAMAGE_LOCATIONS,
  DamageLocation,
} from "../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  ARMOR_SLOT_BY_LOCATION,
  DAMAGE_LOCATION_READING_ORDER,
  DAMAGE_LOCATION_ROWS,
  DAMAGE_LOCATION_SHORT_LABELS,
  DAMAGE_LOCATION_WIRE_TOKENS,
  DAMAGE_LOCATION_BY_WIRE_TOKEN,
  getAdjacentLocation,
  MenuMoveKey,
} from "../../src/utils/damageLocations";

test("lays the body out as one head, one arm/body/arm line and a leg pair", () => {
  expect(DAMAGE_LOCATION_ROWS.map((row) => row.length)).toEqual([1, 3, 2]);
  expect(DAMAGE_LOCATION_ROWS[0]).toEqual(["Head"]);
  expect(DAMAGE_LOCATION_ROWS[1]).toEqual(["Left Arm", "Body", "Right Arm"]);
  expect(DAMAGE_LOCATION_ROWS[2]).toEqual(["Left Leg", "Right Leg"]);
});

test("reading order holds every canonical location exactly once", () => {
  const canonical = new Set(DAMAGE_LOCATION_READING_ORDER);
  expect(canonical.size).toBe(DAMAGE_LOCATION_READING_ORDER.length);
  DAMAGE_LOCATIONS.forEach((location) => {
    expect(canonical.has(location)).toBe(true);
  });
  expect(DAMAGE_LOCATION_READING_ORDER).toEqual([
    "Head",
    "Left Arm",
    "Body",
    "Right Arm",
    "Left Leg",
    "Right Leg",
  ]);
  expect(new Set(DAMAGE_LOCATION_READING_ORDER).size).toBe(
    DAMAGE_LOCATIONS.length
  );
});

test("maps every location onto a simple armor slot", () => {
  expect(ARMOR_SLOT_BY_LOCATION["Head"]).toBe("headAP");
  expect(ARMOR_SLOT_BY_LOCATION["Right Arm"]).toBe("armsAP");
  expect(ARMOR_SLOT_BY_LOCATION["Left Leg"]).toBe("legsAP");
});

test("maps each stored location to one unique canonical wire token", () => {
  const tokens = DAMAGE_LOCATIONS.map(
    (location) => DAMAGE_LOCATION_WIRE_TOKENS[location]
  );
  expect(new Set(tokens).size).toBe(DAMAGE_LOCATIONS.length);
  DAMAGE_LOCATIONS.forEach((location) => {
    expect(
      DAMAGE_LOCATION_BY_WIRE_TOKEN[DAMAGE_LOCATION_WIRE_TOKENS[location]]
    ).toBe(location);
  });
});

test("gives every location a short caption", () => {
  DAMAGE_LOCATIONS.forEach((location) => {
    expect(DAMAGE_LOCATION_SHORT_LABELS[location]).toBeTruthy();
  });
  expect(DAMAGE_LOCATION_SHORT_LABELS["Left Arm"]).toBe("L. Arm");
  expect(DAMAGE_LOCATION_SHORT_LABELS["Right Leg"]).toBe("R. Leg");
});

describe("getAdjacentLocation moves by geometry", () => {
  const move = (location: DamageLocation, key: MenuMoveKey) =>
    getAdjacentLocation(location, key);

  test("left and right stay inside their row", () => {
    expect(move("Left Arm", "ArrowLeft")).toBeNull();
    expect(move("Left Arm", "ArrowRight")).toBe("Body");
    expect(move("Body", "ArrowRight")).toBe("Right Arm");
    expect(move("Right Arm", "ArrowRight")).toBeNull();
    expect(move("Left Leg", "ArrowRight")).toBe("Right Leg");
    expect(move("Right Leg", "ArrowRight")).toBeNull();
    expect(move("Head", "ArrowLeft")).toBeNull();
    expect(move("Head", "ArrowRight")).toBeNull();
  });

  test("down and up move to the same position in the adjacent row", () => {
    expect(move("Head", "ArrowDown")).toBe("Left Arm");
    expect(move("Left Arm", "ArrowDown")).toBe("Left Leg");
    expect(move("Body", "ArrowDown")).toBe("Right Leg");
    // The leg row is shorter, so the right-arm column clamps onto Right Leg.
    expect(move("Right Arm", "ArrowDown")).toBe("Right Leg");
    expect(move("Left Leg", "ArrowUp")).toBe("Left Arm");
    expect(move("Right Leg", "ArrowUp")).toBe("Body");
    expect(move("Head", "ArrowUp")).toBeNull();
    expect(move("Left Leg", "ArrowDown")).toBeNull();
    expect(move("Right Leg", "ArrowDown")).toBeNull();
  });

  test("home and end reach the reading-order ends", () => {
    expect(move("Body", "Home")).toBe("Head");
    expect(move("Head", "Home")).toBe("Head");
    expect(move("Body", "End")).toBe("Right Leg");
    expect(move("Right Leg", "End")).toBe("Right Leg");
  });
});
