import { getVehicleHitLocation } from "../../../../src/utils/WarhammerCustom/defender/vehicleHitLocation";

describe("getVehicleHitLocation", () => {
  test.each([
    [1, "Motive Systems"],
    [20, "Motive Systems"],
    [21, "Hull"],
    [60, "Hull"],
    [61, "Weapons"],
    [80, "Weapons"],
    [81, "Turret"],
    [0, "Turret"],
  ])("maps reversed roll %s to %s", (result, location) => {
    expect(getVehicleHitLocation(result)).toBe(location);
  });
});
