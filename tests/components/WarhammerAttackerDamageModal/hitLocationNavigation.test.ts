import { DamageLocation } from "../../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  getAdjacentLocation,
  MenuMoveKey,
} from "../../../src/components/WarhammerAttackerDamageModal/hitLocationNavigation";

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

  test("up and down move to the same position in the adjacent row", () => {
    expect(move("Head", "ArrowDown")).toBe("Left Arm");
    expect(move("Left Arm", "ArrowDown")).toBe("Left Leg");
    expect(move("Body", "ArrowDown")).toBe("Right Leg");
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
