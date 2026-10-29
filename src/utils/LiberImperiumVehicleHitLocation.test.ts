import LiberImperiumVehicleHitLocation from "./LiberImperiumVehicleHitLocation";

describe("LiberImperiumVehicleHitLocation", () => {
  test.each([
    ["01", "Motive Systems"],
    ["20", "Motive Systems"],
    ["21", "Hull"],
    ["60", "Hull"],
    ["61", "Weapons"],
    ["80", "Weapons"],
    ["81", "Turret"],
    ["00", "Turret"],
  ])("maps reversed roll %s to %s", (result, location) => {
    expect(LiberImperiumVehicleHitLocation(result)).toBe(location);
  });
});
